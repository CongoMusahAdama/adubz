import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

import collageImageA from "./asset/image.jpg";
import collageImageB from "./asset/image1.jpg";
import collageImageC from "./asset/image2.jpg";
import collageImageD from "./asset/image3.jpg";
import lakeImage from "./asset/lake.jpg";
import armsCrossedImage from "./asset/arms-crossed.jpg";
import poseImage from "./asset/pose.jpg";
import finalYearImage from "./asset/final-year.jpg";
import beachImage from "./asset/beach.jpg";

// Opening screen ("Watch Glance"): gaps in seconds before each step.
const SPLASH_STEPS = [0.1, 0.8, 1.0, 0.8, 0.8];
const SPLASH_HOLD = 1.6;
const SPLASH_EXIT = 0.8;

// Moments gallery: caption shown on the photo, focus keeps faces in frame when cropped.
const collageImages = [
  { src: collageImageA, caption: "Kente and that smile", focus: "35% 45%" },
  { src: finalYearImage, caption: "Final year, pen in hand", focus: "50% 30%" },
  { src: collageImageB, caption: "Kente on campus", focus: "50% 28%" },
  { src: lakeImage, caption: "By the lake", focus: "50% 58%" },
  { src: collageImageC, caption: "Front and centre", focus: "50% 35%" },
  { src: armsCrossedImage, caption: "Arms crossed, all smiles", focus: "50% 40%" },
  { src: collageImageD, caption: "Blue print, bright day", focus: "50% 25%" },
  { src: poseImage, caption: "Striking a pose", focus: "50% 35%" }
];
const pad2 = (n) => String(n).padStart(2, "0");

// Scattered spots on the table: [left %, top %, rotation deg, parallax depth px].
const POLAROID_SPOTS = [
  [18, 22, -9, 34],
  [42, 16, 6, -22],
  [68, 20, -4, 42],
  [86, 30, 10, -30],
  [14, 68, 7, 26],
  [36, 80, -6, -38],
  [64, 82, 5, 22],
  [86, 72, -8, -28]
];

function Moments({ ready }) {
  const tableRef = useRef(null);
  const zRef = useRef(collageImages.length);
  const [inView, setInView] = useState(false);
  const [dealt, setDealt] = useState(false);
  const [settled, setSettled] = useState(false);
  const [active, setActive] = useState(-1);
  const [hovering, setHovering] = useState(false);
  const [stack, setStack] = useState(() => collageImages.map((_, i) => i + 1));
  const count = collageImages.length;

  // Watch the table come into view.
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(table);
    return () => io.disconnect();
  }, []);

  // Deal the polaroids onto the table the first time it is seen.
  useEffect(() => {
    if (ready && inView && !dealt) setDealt(true);
  }, [ready, inView, dealt]);

  // Once the last one has landed, lift the first polaroid.
  useEffect(() => {
    if (!dealt) return undefined;
    const t = window.setTimeout(() => {
      setSettled(true);
      setActive(0);
    }, 110 * count + 900);
    return () => window.clearTimeout(t);
  }, [dealt, count]);

  // Scroll parallax: --p runs from -1 (below centre) to 1 (above).
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = table.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      const p = (window.innerHeight / 2 - centre) / window.innerHeight;
      table.style.setProperty("--p", Math.max(-1, Math.min(1, p)).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const lift = (next) => {
    setActive((prev) => {
      const k = (next + count) % count;
      if (prev >= 0 && prev !== k) {
        zRef.current += 1;
        const z = zRef.current;
        setStack((s) => s.map((v, i) => (i === prev ? z : v)));
      }
      return k;
    });
  };

  // Lift the next polaroid every few seconds while the table is on screen.
  useEffect(() => {
    if (!settled || hovering || !inView) return undefined;
    const t = window.setTimeout(() => lift(active + 1), 4000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settled, hovering, inView]);

  return (
    <div className="moments">
      <div className="section-head">
        <span>Moments</span>
        <span className="mono" aria-live="polite">
          {pad2(Math.max(active, 0) + 1)} / {pad2(count)}
        </span>
      </div>
      <div
        ref={tableRef}
        className="ptable"
        data-dealt={dealt ? "" : undefined}
        data-settled={settled ? "" : undefined}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={() => setHovering(false)}
      >
        {collageImages.map((image, index) => {
          const [x, y, r, depth] = POLAROID_SPOTS[index];
          return (
            <button
              type="button"
              key={image.src}
              className="pol"
              data-front={index === active ? "" : undefined}
              aria-label={image.caption}
              aria-pressed={index === active}
              onClick={() => lift(index)}
              style={{
                "--x": `${x}%`,
                "--y": `${y}%`,
                "--r": `${r}deg`,
                "--depth": depth,
                "--z": stack[index],
                "--i": index
              }}
            >
              <img
                src={image.src}
                alt=""
                loading="lazy"
                style={{ objectPosition: image.focus }}
              />
              <span className="pol-cap">{image.caption}</span>
            </button>
          );
        })}
        <span className="ptable-hint" aria-hidden="true">TAP A POLAROID</span>
      </div>
    </div>
  );
}

const navLinks = [
  { href: "#poem", label: "Poem" },
  { href: "#story", label: "Story" },
  { href: "#message", label: "Message" },
  { href: "#thanks", label: "Thanks" }
];

// ---------- Intro message: streamed in word by word ----------
// `photo` tokens are phrases with her picture hidden inside, like the reference.
const toWords = (text) => text.split(" ").map((t) => ({ t }));
// Key phrases get a highlighter sweep (pink, yellow or green) once their last word lands.
let highlightId = 0;
const hlWords = (text, color) => {
  highlightId += 1;
  const group = highlightId;
  return toWords(text).map((w) => ({ ...w, hl: color, group }));
};
const introWords = [
  ...toWords("Today the world feels a little brighter, because"),
  { t: "you were born", photo: lakeImage, alt: "Adubz smiling by the lake" },
  ...toWords("on this blessed"),
  { t: "11/11", strong: true, slow: true, after: "." },
  ...toWords("Wrapped in"),
  ...hlWords("God’s grace, peace, and light,", "yellow"),
  ...toWords("this day belongs to you."),
  { t: "", br: true },
  ...toWords("You carry"),
  { t: "a kind of light", photo: poseImage, alt: "Adubz striking a pose" },
  ...toWords("that makes people feel at home. You give without counting,"),
  { t: "you show up", photo: collageImageB, alt: "Adubz in kente on campus" },
  ...toWords("without being asked, and you love in ways that quietly change"),
  { t: "everyone around you", photo: collageImageC, alt: "Adubz front and centre with friends", after: "." },
  ...hlWords("The world is softer and kinder because you are in it.", "pink"),
  { t: "", br: true },
  ...toWords("This is"),
  { t: "your final year", photo: finalYearImage, alt: "Adubz in her final year, laptop and pen in hand", after: "," },
  ...toWords("and the finish line is already calling your name."),
  { t: "Every late night", photo: collageImageA, alt: "Adubz in kente with her laptop", after: "," },
  ...toWords("every prayer and every sacrifice is about to bloom."),
  ...hlWords("Finish strong, finish proud,", "green"),
  ...toWords("finish as"),
  { t: "GREATNESSADUBEA", photo: armsCrossedImage, alt: "Adubz, arms crossed and smiling", after: "." }
];

// Group consecutive highlighted words so one marker sweep covers the phrase.
const introSegments = introWords.reduce((segments, word, index) => {
  const last = segments[segments.length - 1];
  if (word.group && last?.group === word.group) {
    last.indices.push(index);
  } else if (word.group) {
    segments.push({ group: word.group, color: word.hl, indices: [index] });
  } else {
    segments.push({ index });
  }
  return segments;
}, []);
const introText = introWords
  .filter((w) => !w.br)
  .map((w) => w.t + (w.after || ""))
  .join(" ");

// Timing modelled on the reference intro (seconds).
const INTRO = {
  wordBase: 0.11,
  perLetter: 0.03,
  commaPause: 0.16,
  stopPause: 0.32,
  linePause: 0.42,
  slowFactor: 1.4,
  signaturePause: 0.4,
  greetingPause: 0.4,
  fastSpeed: 0.3,
  heroPace: 0.95 // calm, readable pace for the hero message
};

const wordDelay = (word) => {
  if (word.br) return INTRO.linePause;
  const full = word.t + (word.after || "");
  let delay = INTRO.wordBase + word.t.length * INTRO.perLetter;
  if (word.slow || word.photo) delay *= INTRO.slowFactor;
  if (/[,;:]$/.test(full)) delay += INTRO.commaPause;
  if (/[.!?”]$/.test(full)) delay += INTRO.stopPause;
  return delay;
};

// Section text streaming: every word gets a CSS transition delay, and the
// section plays once it scrolls into view after the intro has finished.
const SECTION_PACE = 0.5;
function createStream(pace = SECTION_PACE) {
  let clock = 0;
  const words = (text, options = {}) =>
    text.split(" ").map((t, i) => {
      const delay = clock;
      clock += wordDelay({ t, slow: options.slow }) * pace;
      return (
        <Fragment key={`${t}-${i}`}>
          {i > 0 ? " " : null}
          <span className="sw" style={{ "--d": `${delay.toFixed(2)}s` }}>
            {t}
          </span>
        </Fragment>
      );
    });
  const pause = (seconds = INTRO.linePause) => {
    clock += seconds * pace;
  };
  const item = () => {
    const delay = clock;
    clock += 0.12;
    return { "--d": `${delay.toFixed(2)}s` };
  };
  // A phrase with a photo hidden inside, streamed in as one word.
  const photo = (text, src, alt) => {
    const delay = clock;
    clock += wordDelay({ t: text, photo: true }) * pace;
    return (
      <span className="sw" style={{ "--d": `${delay.toFixed(2)}s` }}>
        <PhotoPhrase text={text} src={src} alt={alt} />
      </span>
    );
  };
  // Words wrapped in a highlighter sweep that runs after the phrase has landed.
  const mark = (text, color, options) => {
    const inner = words(text, options);
    return (
      <span className={`hl hl-${color}`} style={{ "--hd": `${clock.toFixed(2)}s` }}>
        {inner}
      </span>
    );
  };
  return { words, pause, item, photo, mark };
}

const poemLines = [
  [
    "Adubz, you stand where dawn and daring meet,",
    "In every whisper of the wind you greet",
    "The challenge, the call, the flame inside your heart,",
    "#GREATNESSADUBEA, your life’s unique art."
  ],
  [
    "With courage stitched in seams of hope and light,",
    "You forge tomorrow from the longest night.",
    "So rise, beloved friend, on wings of your own truth,",
    "Dance in the mirror of time, renew your youth."
  ]
];

const POEM_HIGHLIGHTS = {
  "#GREATNESSADUBEA, your life’s unique art.": "yellow",
  "You forge tomorrow from the longest night.": "pink"
};

// Message bodies: plain strings, { photo } phrases with her picture inside,
// or { mark } phrases with a coloured highlighter sweep.
const messageItems = [
  {
    title: "The Final Lap",
    body: [
      "Final year.",
      { t: "The late nights, the deadlines,", photo: finalYearImage, alt: "Adubz in her final year, laptop and pen in hand" },
      "the prayers whispered over open books.",
      { mark: "None of it was wasted.", color: "pink" },
      "Finish strong, and walk across that stage knowing you earned every single step."
    ]
  },
  {
    title: "Strength in Motion",
    body: [
      "Carry the strength that forged #GREATNESSADUBEA into every exam, every project,",
      { t: "every room you walk into.", photo: collageImageC, alt: "Adubz in class" },
      { mark: "It is the drumbeat that keeps you moving.", color: "yellow" }
    ]
  },
  {
    title: "Endless Light",
    body: [
      { mark: "You are seen. You are valued.", color: "green" },
      "You are",
      { t: "greatness in motion.", photo: collageImageA, alt: "Adubz celebration joy" },
      "Here’s to the next bold step and the endless light ahead."
    ]
  }
];

// ---------- Typing beeps (synthesised with Web Audio, no files) ----------
// Browsers only allow sound after the visitor taps/clicks, so unlock() runs on
// the first interaction. Every word plays one short,
// a soft, simple blip.

const sound = {
  ctx: null,
  master: null,
  unlock() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    // iPhone: let the sound play even when the ring/silent switch is on silent.
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
    } catch {
      /* not supported */
    }
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      // Soften the square wave's harsh top end so the beep is crisp, not shrill.
      const tone = this.ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 4200;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(tone).connect(this.ctx.destination);
    }
    if (this.ctx.state !== "running") {
      this.ctx.resume().catch(() => {});
      // Playing a silent sound inside the tap is what fully unlocks iOS Safari.
      const silent = this.ctx.createBufferSource();
      silent.buffer = this.ctx.createBuffer(1, 1, 22050);
      silent.connect(this.ctx.destination);
      silent.start(0);
    }
  },
  live() {
    return Boolean(this.ctx && this.ctx.state === "running");
  },
  // One soft blip: a pure sine tone that dips slightly in pitch and fades fast,
  // like a gentle "bloop". No harsh edges.
  blip(at, freq, length = 0.09, volume = 0.08) {
    if (!this.live()) return;
    const { ctx } = this;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + length + 0.02);
  },
  // Per word: the same soft note with a tiny natural variation.
  tick(at = 0, pitch = 1) {
    this.blip(at, 660 * pitch * (0.98 + Math.random() * 0.04));
  },
  // When a highlighted phrase finishes: one slightly brighter, longer blip.
  swish(at = 0) {
    this.blip(at, 880, 0.16, 0.08);
  }
};

const FastForwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M1.5 3.2v9.6c0 .5.6.8 1 .5L8 9.2v3.6c0 .5.6.8 1 .5l5.9-4.8c.3-.3.3-.7 0-1L9 2.7c-.4-.3-1 0-1 .5v3.6L2.5 2.7c-.4-.3-1 0-1 .5Z" />
  </svg>
);

// A phrase with her photo tucked inside: thumbnail + dotted underline,
// preview card on hover (desktop) or tap (phone).
function PhotoPhrase({ text, src, alt }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0, width: 190, originX: 95, above: false });

  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = window.innerWidth < 600 ? 170 : 190;
    const height = width * 1.2;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, 16),
      window.innerWidth - width - 16
    );
    // Prefer opening above the phrase, like a tooltip; fall back to below.
    const above = rect.top - height - 12 > 70;
    const top = above ? rect.top - height - 12 : rect.bottom + 12;
    // Grow out of the little thumbnail.
    const originX = Math.min(Math.max(rect.left + 8 - left, 12), width - 12);
    setPos({ left, top, width, originX, above });
  };

  const show = () => {
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onDown = (event) => {
      if (!triggerRef.current?.contains(event.target)) close();
    };
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="phrase"
        data-open={open ? "" : undefined}
        aria-expanded={open}
        onPointerEnter={(e) => e.pointerType === "mouse" && show()}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        onClick={() => (open ? setOpen(false) : show())}
      >
        <span className="phrase-thumb">
          <img src={src} alt="" />
        </span>
        <span className="phrase-text">{text}</span>
      </button>
      {createPortal(
        <span
          className="phrase-preview"
          data-open={open ? "" : undefined}
          data-above={pos.above ? "" : undefined}
          style={{
            left: pos.left,
            top: pos.top,
            width: pos.width,
            "--origin-x": `${pos.originX}px`
          }}
          aria-hidden={!open}
        >
          <img src={src} alt={alt} />
        </span>,
        document.body
      )}
    </>
  );
}

const CandleIcon = ({ out }) => (
  <span className="candle" data-out={out ? "" : undefined} aria-hidden="true">
    <span className="candle-flame" />
    <span className="candle-smoke" />
    <span className="candle-stick" />
  </span>
);

export default function App() {
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const observerRef = useRef(null);
  const titleRef = useRef(null);
  const introTimerRef = useRef(null);
  const speedRef = useRef(1);
  const introSkippedRef = useRef(false);
  const wishTimerRef = useRef(null);
  const balloonsFiredRef = useRef(false);

  const splashTimerRef = useRef(null);
  const splashLeftRef = useRef(false);
  const splashTappedRef = useRef(false);
  const [splashStep, setSplashStep] = useState(0);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [introPhase, setIntroPhase] = useState("splash"); // splash → running → streaming → done
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  // ---------- Sound: unlock on the first interaction ----------
  useEffect(() => {
    const unlock = () => {
      sound.unlock();
      setSoundUnlocked(true);
    };
    // Phones only allow audio from the END of a tap (touchend / pointerup / click).
    const events = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
    events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  const [greetingShown, setGreetingShown] = useState(false);
  const [revealedWords, setRevealedWords] = useState(0);
  const [fastForward, setFastForward] = useState(false);
  const [wishMade, setWishMade] = useState(false);

  // ---------- Intro sequence ----------
  useEffect(() => {
    document.documentElement.dataset.preloader = introPhase;
  }, [introPhase]);

  const wait = (seconds, fn) => {
    window.clearTimeout(introTimerRef.current);
    introTimerRef.current = window.setTimeout(
      fn,
      seconds * 1000 * speedRef.current
    );
  };

  // ---------- Opening screen ----------
  const splashWait = (seconds, fn) => {
    window.clearTimeout(splashTimerRef.current);
    splashTimerRef.current = window.setTimeout(
      fn,
      seconds * 1000 * speedRef.current
    );
  };

  const leaveSplash = () => {
    if (splashLeftRef.current) return;
    splashLeftRef.current = true;
    setSplashStep(SPLASH_STEPS.length);
    setSplashLeaving(true);
    splashWait(SPLASH_EXIT, () => {
      if (!introSkippedRef.current) setIntroPhase("running");
    });
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return undefined;

    let step = 0;
    const next = () => {
      step += 1;
      setSplashStep(step);
      if (step < SPLASH_STEPS.length) splashWait(SPLASH_STEPS[step], next);
      else splashWait(SPLASH_HOLD, leaveSplash);
    };
    splashWait(SPLASH_STEPS[0], next);

    return () => window.clearTimeout(splashTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishIntro = () => {
    introSkippedRef.current = true;
    splashLeftRef.current = true;
    window.clearTimeout(splashTimerRef.current);
    setSplashLeaving(true);
    window.clearTimeout(introTimerRef.current);
    titleRef.current?.getAnimations?.().forEach((a) => a.finish());
    setGreetingShown(true);
    setRevealedWords(introWords.length);
    setIntroPhase("done");
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      finishIntro();
      return undefined;
    }

    const streamWord = (index) => {
      if (index >= introWords.length) {
        wait(INTRO.linePause, () => setIntroPhase("done"));
        return;
      }
      setRevealedWords(index + 1);
      const word = introWords[index];
      if (!word.br) sound.tick(0, word.photo ? 1.25 : 1);
      if (word.group && introWords[index + 1]?.group !== word.group) {
        sound.swish(0.25, 1.1); // highlighter sweep for the finished phrase
      }
      wait(wordDelay(introWords[index]) * INTRO.heroPace, () =>
        streamWord(index + 1)
      );
    };

    const title = titleRef.current;
    const onSigned = () => {
      if (introSkippedRef.current) return;
      wait(INTRO.signaturePause, () => {
        setGreetingShown(true);
        wait(INTRO.greetingPause + 0.4, () => {
          setIntroPhase("streaming");
          streamWord(0);
        });
      });
    };

    title?.addEventListener("animationend", onSigned, { once: true });

    return () => {
      title?.removeEventListener("animationend", onSigned);
      window.clearTimeout(introTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFastForward = () => {
    setFastForward((prev) => {
      const next = !prev;
      speedRef.current = next ? INTRO.fastSpeed : 1;
      titleRef.current
        ?.getAnimations?.()
        .forEach((a) => a.updatePlaybackRate(next ? 1 / INTRO.fastSpeed : 1));
      return next;
    });
  };

  // ---------- Drifting flowers ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const isNarrow = window.innerWidth < 700;
    const particleCount = isNarrow ? 12 : 22;
    const particles = [];
    const palette = [
      [255, 160, 60],
      [255, 128, 48],
      [247, 107, 21],
      [255, 186, 90],
      [250, 140, 110]
    ];

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.depth = Math.random();
        this.size = (isNarrow ? 10 : 14) + this.depth * (isNarrow ? 16 : 26);
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : -this.size * 2;
        this.speedY = 0.15 + this.depth * 0.45;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.01;
        this.sway = Math.random() * Math.PI * 2;
        this.alpha = 0.55 + this.depth * 0.4;
        this.blur = this.depth > 0.85 ? 6 : this.depth < 0.2 ? 2 : 0;
        const [r, g, b] = palette[Math.floor(Math.random() * palette.length)];
        this.color = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        this.center = `rgba(255, 236, 200, ${this.alpha})`;
      }

      update() {
        this.sway += 0.01;
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.sway) * 0.25;
        this.rotation += this.spin;

        if (
          this.y > canvas.height + this.size * 2 ||
          this.x < -this.size * 2 ||
          this.x > canvas.width + this.size * 2
        ) {
          this.reset();
        }
      }

      draw() {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation);
        context.filter = this.blur ? `blur(${this.blur}px)` : "none";
        context.fillStyle = this.color;
        for (let i = 0; i < 5; i += 1) {
          context.rotate((Math.PI * 2) / 5);
          context.beginPath();
          context.ellipse(0, -this.size * 0.42, this.size * 0.26, this.size * 0.42, 0, 0, Math.PI * 2);
          context.fill();
        }
        context.beginPath();
        context.arc(0, 0, this.size * 0.12, 0, Math.PI * 2);
        context.fillStyle = this.center;
        context.fill();
        context.restore();
      }
    }

    for (let i = 0; i < particleCount; i += 1) {
      particles.push(new Particle());
    }

    let animationFrame;
    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // ---------- Sections reveal on scroll ----------
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("[data-observe]"));
    sections.forEach((section) => section.classList.add("fade-in"));
    heroRef.current?.classList.add("visible");

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    sections.forEach((section) => observerRef.current?.observe(section));
    return () => observerRef.current?.disconnect();
  }, []);

  // ---------- Balloon burst on first interaction after the intro ----------
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (balloonsFiredRef.current) return;
      if (document.documentElement.dataset.preloader !== "done") return;

      const colors = ["#ffa03c", "#f76b15", "#ffc53d", "#fa8c6e", "#ffe7b3"];
      const defaults = { spread: 70, ticks: 250, gravity: 0.7 };
      [0.25, 0.5, 0.75].forEach((x) =>
        confetti({ ...defaults, origin: { x, y: 1.2 }, particleCount: 80, colors })
      );
      balloonsFiredRef.current = true;
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };

    window.addEventListener("scroll", handleFirstInteraction);
    window.addEventListener("pointerdown", handleFirstInteraction);
    return () => {
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, []);

  // ---------- Make a wish ----------
  const handleWish = (event) => {
    if (wishMade) return;
    setWishMade(true);
    const rect = event.currentTarget.getBoundingClientRect();
    const origin = {
      x: (rect.left + 22) / window.innerWidth,
      y: rect.top / window.innerHeight
    };
    const colors = ["#ffa03c", "#f76b15", "#ffc53d", "#fa8c6e", "#202020"];
    window.setTimeout(() => {
      confetti({ origin, spread: 70, startVelocity: 38, particleCount: 90, colors, scalar: 0.9 });
      confetti({ origin, spread: 120, startVelocity: 22, particleCount: 50, colors, shapes: ["star"], scalar: 1.1 });
    }, 450);
    window.clearTimeout(wishTimerRef.current);
    wishTimerRef.current = window.setTimeout(() => setWishMade(false), 6000);
  };

  useEffect(() => () => window.clearTimeout(wishTimerRef.current), []);

  // Per-section word streams (rebuilt each render, deterministic).
  const poem = createStream();
  const story = createStream();
  const message = createStream();
  const thanks = createStream();
  const footer = createStream();

  return (
    <>
      <div className="sunburst" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <canvas id="particles" ref={canvasRef} />

      <div
        className={[
          "splash",
          ...SPLASH_STEPS.slice(0, splashStep).map((_, i) => `s${i + 1}`),
          splashLeaving ? "out" : ""
        ].join(" ")}
        onClick={() => {
          // The first tap only switches the sound on; the next one continues.
          if (!splashTappedRef.current) {
            splashTappedRef.current = true;
            return;
          }
          leaveSplash();
        }}
        aria-hidden={introPhase !== "splash"}
      >
        <div className="splash-card">
          <div className="splash-zoom">
            <img src={beachImage} alt="Adubz at the beach, checking her watch" />
            <span className="splash-ring" aria-hidden="true" />
            <span className="splash-bubble">11:11</span>
          </div>
        </div>
        <div className="splash-cap">
          <div className="splash-date">11 · 11 · 2026</div>
          <div className="splash-time">
            <span className="splash-write">It&apos;s time.</span>
          </div>
        </div>
        <div
          className="splash-sound-hint"
          data-hidden={soundUnlocked ? "" : undefined}
          aria-hidden="true"
        >
          Tap anywhere for sound
        </div>
      </div>

      <nav className="top-nav intro-veil">
        <a className="logo" href="#top">adubz</a>
        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <header className="hero fade-in" ref={heroRef} id="top">
        <div className="hero-body">
          <div className="hero-text">
            <div className="intro">
              <h1 className="hero-title">
                <span className="write-on" ref={titleRef}>
                  It&apos;s Time to Celebrate, Adubz!
                </span>
              </h1>
              <p
                className="hero-kicker intro-line"
                data-shown={greetingShown ? "" : undefined}
              >
                Celebrate as you please!
                <span className="kicker-emoji" aria-hidden="true">🎉</span>
              </p>
              <p className="hero-description">
                <span className="sr-only">{introText}</span>
                {introSegments.map((segment) => {
                  const renderWord = (index, inGroup) => {
                    const word = introWords[index];
                    if (word.br) {
                      return <span key={index} className="intro-break" aria-hidden="true" />;
                    }
                    const spaceBefore =
                      index > 0 && !introWords[index - 1].br &&
                      !(inGroup && index === inGroup);
                    return (
                      <Fragment key={index}>
                        {spaceBefore ? " " : null}
                        <span
                          className="intro-word"
                          aria-hidden="true"
                          data-pending={index >= revealedWords ? "" : undefined}
                          data-slow={word.slow || word.photo ? "" : undefined}
                        >
                          {word.photo ? (
                            <PhotoPhrase text={word.t} src={word.photo} alt={word.alt} />
                          ) : word.strong ? (
                            <strong>{word.t}</strong>
                          ) : (
                            word.t
                          )}
                          {word.after}
                        </span>
                      </Fragment>
                    );
                  };
                  if (segment.group == null) return renderWord(segment.index);
                  const first = segment.indices[0];
                  const last = segment.indices[segment.indices.length - 1];
                  return (
                    <Fragment key={`g${segment.group}`}>
                      {" "}
                      <span
                        className={`hl hl-${segment.color}`}
                        data-on={revealedWords > last ? "" : undefined}
                      >
                        {segment.indices.map((i) => renderWord(i, first))}
                      </span>
                    </Fragment>
                  );
                })}
              </p>
            </div>

            <div className="intro-veil">
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn wish-btn"
                  data-made={wishMade ? "" : undefined}
                  onClick={handleWish}
                  aria-live="polite"
                >
                  <CandleIcon out={wishMade} />
                  {wishMade ? "Wish sent to the stars" : "Make a wish"}
                </button>
                <a className="btn btn-ghost" href="#story">
                  View Story
                </a>
              </div>
              <p className="wish-note" data-shown={wishMade ? "" : undefined}>
                May every wish you make this year come true.
              </p>
              <div className="quote-badge">#GREATNESSADUBEA</div>
            </div>
          </div>

          <div className="hero-media intro-veil">
            <Moments ready={introPhase === "done"} />
          </div>
        </div>
      </header>

      <main className="intro-veil">
        <section className="content-section poem-section" data-observe id="poem">
          <div className="content-card poem-card">
            <div className="section-head">
              <h2 className="section-title">{poem.words("Poem for Adubz")}</h2>
              <span className="mono sw" style={poem.item()}>01</span>
            </div>
            <p className="section-lead">
              {poem.words(
                "A dawn-lit dedication to the fearless rhythm of your spirit."
              )}
            </p>
            <div className="poem-body sw-box" style={poem.item()}>
              {poemLines.map((stanza, s) => (
                <div className="poem-column" key={s}>
                  {stanza.map((line) => {
                    const color = POEM_HIGHLIGHTS[line];
                    const rendered = (
                      <span key={line}>
                        {color ? poem.mark(line, color) : poem.words(line)}
                      </span>
                    );
                    poem.pause();
                    return rendered;
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section story-section" data-observe id="story">
          <div className="content-card story-card">
            <div className="section-head">
              <h2 className="section-title">{story.words("Why Greatness")}</h2>
              <span className="mono sw" style={story.item()}>02</span>
            </div>
            <div className="story-body">
              <blockquote className="story-highlight">
                {story.words("“Not just enough.", { slow: true })}{" "}
                {story.mark("I must become greatness.”", "pink", { slow: true })}
              </blockquote>
              {story.pause()}
              <p>
                {story.words("You coined")}{" "}
                {story.photo("#GREATNESSADUBEA", armsCrossedImage, "Adubz, arms crossed and smiling")}{" "}
                {story.words("as a banner against doubt,")}{" "}
                {story.mark("a mantra that turns hesitation into heat.", "green")}{" "}
                {story.words("It became")}{" "}
                {story.photo("your name", collageImageD, "Adubz festive spark")}{" "}
                {story.words(
                  "stretched into a mission, a compass stitched to your heart."
                )}
              </p>
              {story.pause()}
              <p>
                {story.words("When you")}{" "}
                {story.photo("sign it “Adubz,”", poseImage, "Adubz striking a pose")}{" "}
                {story.words(
                  "you wrap that fire in closeness, a gentle whisper that reminds us the journey toward greatness is"
                )}{" "}
                {story.mark("both epic and tender.", "yellow")}
              </p>
            </div>
          </div>
        </section>

        <section
          className="content-section motivation-section"
          data-observe
          id="message"
        >
          <div className="content-card motivation-card">
            <div className="section-head">
              <h2 className="section-title">
                {message.words("This is my little message for you")}
              </h2>
              <span className="mono sw" style={message.item()}>03</span>
            </div>
            <p className="section-lead">
              {message.words(
                "A toast to the horizon you are already lighting up, and to the final chapter you are about to close in style."
              )}
            </p>
            <div className="motivation-grid">
              {messageItems.map((item) => {
                const rowStyle = message.item();
                const title = message.words(item.title);
                const body = item.body.map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 ? " " : null}
                    {typeof part === "string"
                      ? message.words(part)
                      : part.mark
                        ? message.mark(part.mark, part.color)
                        : message.photo(part.t, part.photo, part.alt)}
                  </Fragment>
                ));
                message.pause();
                return (
                  <div className="motivation-item sw-row" style={rowStyle} key={item.title}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                );
              })}
            </div>
            <p className="signoff">
              {message.words(
                "Happy birthday, Adubz. The best chapter is still being written, and you are holding the pen.",
                { slow: true }
              )}
            </p>
          </div>
        </section>

        <section className="content-section thanks-section" data-observe id="thanks">
          <div className="content-card thanks-card">
            <div className="section-head">
              <h2 className="section-title">{thanks.words("A big thank you")}</h2>
              <span className="mono sw" style={thanks.item()}>04</span>
            </div>
            <p className="section-lead">
              {thanks.words("For everything you do, the seen and the unseen.")}
            </p>

            <div className="thanks-notes">
              <div className="thanks-note sw-row" style={thanks.item()}>
                <span className="thanks-from">From me</span>
                <p>
                  {thanks.words(
                    "I truly appreciate your support and everything you do for me. You have helped me in more ways than I can count, and every time I needed a hand, you showed up without being asked and without keeping score."
                  )}{" "}
                  {thanks.mark(
                    "Your kindness has carried me through days you will never know about.",
                    "yellow"
                  )}{" "}
                  {thanks.words("I don’t take any of it lightly. Thank you, Adubz.")}{" "}
                  {thanks.mark("From the bottom of my heart.", "pink")}
                </p>
                {thanks.pause()}
                <p className="thanks-sign">{thanks.words("With love and gratitude", { slow: true })}</p>
              </div>
              {thanks.pause()}
              <div className="thanks-note sw-row" style={thanks.item()}>
                <span className="thanks-from">From Scentiva</span>
                <p>
                  {thanks.words(
                    "Scentiva is grateful for you too. For your time, your ideas, your patience, and the care you put into"
                  )}{" "}
                  {thanks.photo("everything you touch.", armsCrossedImage, "Adubz, arms crossed and smiling")}{" "}
                  {thanks.words("Thank you for everything you do.")}{" "}
                  {thanks.mark("We see it, and we appreciate you.", "green")}
                </p>
                {thanks.pause()}
                <p className="thanks-sign">{thanks.words("The Scentiva family", { slow: true })}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div
        className="intro-controls"
        role="group"
        aria-label="Intro controls"
        aria-hidden={introPhase === "done"}
      >
        <button
          type="button"
          className="intro-control"
          aria-pressed={fastForward}
          onClick={toggleFastForward}
          tabIndex={introPhase === "done" ? -1 : 0}
        >
          <FastForwardIcon />
          Fast forward
        </button>
        <button
          type="button"
          className="intro-control"
          onClick={finishIntro}
          tabIndex={introPhase === "done" ? -1 : 0}
        >
          Skip
        </button>
      </div>

      <footer className="footer" data-observe>
        <p>
          {footer.words("Made with love for Adubea ·")}{" "}
          <span className="sw tag" style={footer.item()}>#GREATNESSADUBEA</span>
        </p>
      </footer>
    </>
  );
}
