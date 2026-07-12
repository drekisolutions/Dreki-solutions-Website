"use client";

import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

const SECTIONS = [
  { id: "outcomes", label: "Where work stalls" },
  { id: "system", label: "Agent outcomes" },
  { id: "method", label: "The Dreki loop" },
  { id: "about", label: "Built in service" },
  { id: "contact", label: "Contact" },
] as const;

type NetworkInformationLike = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

type TrailParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  ember: boolean;
};

export default function DrekiExperience() {
  const [activeSection, setActiveSection] = useState<(typeof SECTIONS)[number]["id"]>(
    SECTIONS[0].id,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const root = document.documentElement;
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    let particles: TrailParticle[] = [];
    let animationFrame: number | null = null;
    let lastFrameTime = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let enabled = false;

    const clearCanvas = () => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    };

    const stopAnimation = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      lastFrameTime = 0;
      particles = [];
      clearCanvas();
    };

    const resizeCanvas = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const density = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(viewportWidth * density));
      canvas.height = Math.max(1, Math.floor(viewportHeight * density));
      context.setTransform(density, 0, 0, density, 0, 0);
    };

    const drawTrail = (timestamp: number) => {
      animationFrame = null;
      if (!enabled || particles.length === 0) {
        lastFrameTime = 0;
        clearCanvas();
        return;
      }

      const frameScale = lastFrameTime
        ? Math.min((timestamp - lastFrameTime) / 16.67, 2.5)
        : 1;
      lastFrameTime = timestamp;

      context.clearRect(0, 0, viewportWidth, viewportHeight);
      context.globalCompositeOperation = "lighter";

      const nextParticles: TrailParticle[] = [];

      for (const particle of particles) {
        particle.life -= 0.055 * frameScale;
        if (particle.life <= 0) continue;

        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;
        particle.vy -= 0.008 * frameScale;
        particle.vx *= 0.985;
        particle.vy *= 0.985;

        const strength = Math.max(0, particle.life / particle.maxLife);
        const radius = particle.size * (0.65 + strength * 0.55);
        const glow = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          radius * 3.1,
        );

        if (particle.ember) {
          glow.addColorStop(0, `rgba(212, 118, 44, ${strength * 0.9})`);
          glow.addColorStop(0.45, `rgba(180, 81, 27, ${strength * 0.45})`);
        } else {
          glow.addColorStop(0, `rgba(248, 203, 96, ${strength * 0.95})`);
          glow.addColorStop(0.45, `rgba(191, 137, 38, ${strength * 0.48})`);
        }
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");

        context.fillStyle = glow;
        context.beginPath();
        context.arc(particle.x, particle.y, radius * 3.1, 0, Math.PI * 2);
        context.fill();
        nextParticles.push(particle);
      }

      context.globalCompositeOperation = "source-over";
      particles = nextParticles;

      if (particles.length > 0) {
        animationFrame = window.requestAnimationFrame(drawTrail);
      } else {
        lastFrameTime = 0;
        clearCanvas();
      }
    };

    const startAnimation = () => {
      if (animationFrame === null && particles.length > 0) {
        animationFrame = window.requestAnimationFrame(drawTrail);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!enabled) return;

      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);

      for (let index = 0; index < 3; index += 1) {
        const maxLife = 0.72 + Math.random() * 0.28;
        particles.push({
          x: event.clientX + (Math.random() - 0.5) * 8,
          y: event.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.65,
          vy: (Math.random() - 0.5) * 0.65,
          life: maxLife,
          maxLife,
          size: 1.8 + Math.random() * 2.7,
          ember: index === 0,
        });
      }

      if (particles.length > 72) {
        particles = particles.slice(-72);
      }

      startAnimation();
    };

    const shouldEnable = () =>
      !coarseQuery.matches &&
      !motionQuery.matches &&
      !connection?.saveData &&
      document.visibilityState === "visible";

    const reconcileTrail = () => {
      const nextEnabled = shouldEnable();
      if (nextEnabled === enabled) return;

      enabled = nextEnabled;
      if (enabled) {
        resizeCanvas();
        window.addEventListener("pointermove", handlePointerMove, {
          passive: true,
        });
      } else {
        window.removeEventListener("pointermove", handlePointerMove);
        stopAnimation();
        root.style.setProperty("--cursor-x", "50vw");
        root.style.setProperty("--cursor-y", "50vh");
      }
    };

    const handleResize = () => {
      if (enabled) resizeCanvas();
    };

    resizeCanvas();
    reconcileTrail();
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", reconcileTrail);
    coarseQuery.addEventListener("change", reconcileTrail);
    motionQuery.addEventListener("change", reconcileTrail);
    connection?.addEventListener("change", reconcileTrail);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", reconcileTrail);
      coarseQuery.removeEventListener("change", reconcileTrail);
      motionQuery.removeEventListener("change", reconcileTrail);
      connection?.removeEventListener("change", reconcileTrail);
      stopAnimation();
      root.style.removeProperty("--cursor-x");
      root.style.removeProperty("--cursor-y");
    };
  }, []);

  useEffect(() => {
    const elements = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );

    if (elements.length === 0 || !("IntersectionObserver" in window)) return;

    const visibility = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        const visibleSections = elements
          .filter((element) => (visibility.get(element.id) ?? 0) > 0)
          .sort((first, second) => {
            const firstDistance = Math.abs(
              first.getBoundingClientRect().top - window.innerHeight * 0.34,
            );
            const secondDistance = Math.abs(
              second.getBoundingClientRect().top - window.innerHeight * 0.34,
            );
            return firstDistance - secondDistance;
          });

        if (visibleSections[0]) {
          setActiveSection(
            visibleSections[0].id as (typeof SECTIONS)[number]["id"],
          );
        }
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0, 0.05, 0.2, 0.5, 0.8],
      },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const activeIndex = SECTIONS.findIndex(({ id }) => id === activeSection);
  const spineProgress =
    SECTIONS.length > 1 ? (Math.max(activeIndex, 0) / (SECTIONS.length - 1)) * 100 : 0;
  const spineStyle = {
    "--spine-progress": `${spineProgress}%`,
  } as CSSProperties;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="dreki-cursor-canvas"
        data-testid="cursor-canvas"
        aria-hidden="true"
      />

      <nav
        className="dreki-spine"
        style={spineStyle}
        aria-label="Page sections"
        data-testid="spine-nav"
      >
        <span className="dreki-spine__track" aria-hidden="true">
          <span className="dreki-spine__progress" />
        </span>
        <ol className="dreki-spine__list">
          {SECTIONS.map(({ id, label }, index) => {
            const isActive = id === activeSection;
            return (
              <li className="dreki-spine__item" key={id}>
                <a
                  className={`dreki-spine__link${isActive ? " is-active" : ""}`}
                  href={`#${id}`}
                  aria-label={`Go to ${label}`}
                  aria-current={isActive ? "location" : undefined}
                >
                  <span className="dreki-spine__node" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="dreki-spine__label">{label}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

    </>
  );
}
