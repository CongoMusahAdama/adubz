import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import collageImageA from "./asset/image.png";
import collageImageB from "./asset/image1.png";
import collageImageC from "./asset/image2.png";
import collageImageD from "./asset/image3.png";

const collageImages = [
  { src: collageImageA, alt: "Adubz celebration joy" },
  { src: collageImageB, alt: "Adubz with friends" },
  { src: collageImageC, alt: "Adubz vibrant moment" },
  { src: collageImageD, alt: "Adubz festive spark" }
];

const navLinks = [
  { href: "#poem", label: "Poem" },
  { href: "#story", label: "Story" },
  { href: "#message", label: "Message" }
];

export default function App() {
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const observerRef = useRef(null);
  const sectionsRef = useRef([]);
  const [cardOrder, setCardOrder] = useState(
    collageImages.map((_, idx) => idx)
  );
  const balloonsFiredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particleCount = 120;
    const particles = [];

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.6 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.6 + 0.1;
        this.color = `rgba(255, 255, 255, ${this.alpha})`;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        if (
          this.y > canvas.height + 10 ||
          this.x < -10 ||
          this.x > canvas.width + 10
        ) {
          this.reset();
          this.y = -10;
        }
      }

      draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
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

  useEffect(() => {
    sectionsRef.current = Array.from(
      document.querySelectorAll("[data-observe]")
    );

    sectionsRef.current.forEach((section) => section.classList.add("fade-in"));

    if (heroRef.current) {
      heroRef.current.classList.add("visible");
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    sectionsRef.current.forEach((section) => {
      observerRef.current?.observe(section);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCardOrder((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (balloonsFiredRef.current) return;

      const colors = ["#ff8a4c", "#ff5f6d", "#ff85f2", "#ffe3d1", "#ffffff"];
      const defaults = { spread: 70, ticks: 250, gravity: 0.7 };

      const shoot = (originX) => {
        confetti({
          ...defaults,
          origin: { x: originX, y: 1.2 },
          particleCount: 80,
          colors,
        });
      };

      shoot(0.25);
      shoot(0.5);
      shoot(0.75);
      balloonsFiredRef.current = true;
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };

    window.addEventListener("scroll", handleFirstInteraction, { once: true });
    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });

    return () => {
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, []);

  const handleCelebrate = () => {
    confetti({
      spread: 120,
      particleCount: 160,
      origin: { y: 0.6 },
      colors: ["#ff8a4c", "#3793ff", "#ff85f2", "#ffffff"]
    });
  };

  return (
    <>
      <canvas id="particles" ref={canvasRef} />
      <header className="hero fade-in" ref={heroRef}>
        <nav className="top-nav">
          <div className="logo">Adubz</div>
          <div className="nav-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>
        <div className="hero-body">
          <div className="hero-text">
            <span className="hero-kicker">Celebrate as you please!</span>
            <h1 className="hero-title animated-title">
              It&apos;s Time to Celebrate, Adubz!
            </h1>
            <p className="hero-description">
              Wrapped in God’s grace, peace, and light, this day belongs to you.
              On this blessed <strong>11/11</strong>, may every heartbeat echo
              your mantra — GREATNESSADUBEA — as we celebrate the gift you are
              and the grace God continues to pour into your life.
            </p>
            <div className="hero-actions">
              <button
                id="celebrate-btn"
                className="btn celebrate-btn"
                type="button"
                onClick={handleCelebrate}
              >
                Tap to Celebrate 🎉
              </button>
              <a className="btn btn-ghost" href="#story">
                View Story
              </a>
            </div>
            <div className="quote-badge">#GREATNESSADUBEA</div>
          </div>
          <div className="hero-media">
            <div className="hero-collage">
              {collageImages.map((image, index) => (
                <div
                  key={image.src}
                  className={`collage-card position-${cardOrder.indexOf(index)}`}
                >
                  <img src={image.src} alt={image.alt} loading="lazy" />
                </div>
              ))}
              <span className="shape shape-dot" />
              <span className="shape shape-zigzag" />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="content-section poem-section" data-observe id="poem">
          <div className="content-card poem-card">
            <h2 className="section-title animated-title">Poem for Adubz</h2>
            <p className="section-lead">
              A dawn-lit dedication to the fearless rhythm of your spirit.
            </p>
            <div className="poem-body">
              <div className="poem-column">
                <span>Adubz, you stand where dawn and daring meet,</span>
                <span>In every whisper of the wind you greet</span>
                <span>The challenge, the call, the flame inside your heart —</span>
                <span>#GREATNESSADUBEA, your life’s unique art.</span>
              </div>
              <div className="poem-column">
                <span>With courage stitched in seams of hope and light,</span>
                <span>You forge tomorrow from the longest night.</span>
                <span>So rise, beloved friend, on wings of your own truth,</span>
                <span>Dance in the mirror of time, renew your youth.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section story-section" data-observe id="story">
          <div className="content-card story-card">
            <h2 className="section-title animated-title">Why Greatness</h2>
            <div className="story-body">
              <blockquote className="story-highlight">
                “Not just enough — I must become greatness.”
              </blockquote>
              <p>
                You coined #GREATNESSADUBEA as a banner against doubt, a mantra
                that turns hesitation into heat. It became your name stretched
                into a mission, a compass stitched to your heart.
              </p>
              <p>
                When you sign it “Adubz,” you wrap that fire in closeness — a
                gentle whisper that reminds us the journey toward greatness is
                both epic and tender.
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
            <h2 className="section-title animated-title">
              This is my little message for you
            </h2>
            <p className="section-lead">
              A toast to the horizon you are already lighting up.
            </p>
            <div className="motivation-grid">
              <div className="motivation-item">
                <h3>New Chapters</h3>
                <p>
                  May this birthday open a new chapter where you realise more of
                  your vision, page after brilliant page.
                </p>
              </div>
              <div className="motivation-item">
                <h3>Strength in Motion</h3>
                <p>
                  Carry the strength that forged #GREATNESSADUBEA into every
                  moment — it is the drumbeat that keeps you moving.
                </p>
              </div>
              <div className="motivation-item">
                <h3>Endless Light</h3>
                <p>
                  You are seen. You are valued. You are greatness in motion. Here’s
                  to the next bold step and the endless light ahead.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" data-observe>
        <p>
          Made with love for Adubea &mdash; <span>#GREATNESSADUBEA</span>
        </p>
      </footer>
    </>
  );
}

