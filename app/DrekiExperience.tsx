"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";

const INTRO_SESSION_KEY = "dreki:intro-seen:v1";
const INTRO_WINDOW_TOKEN = "[dreki:intro-seen:v1]";
const INTRO_DURATION_MS = 2600;

const SECTIONS = [
  { id: "outcomes", label: "Where work stalls" },
  { id: "system", label: "Agent outcomes" },
  { id: "method", label: "The Dreki loop" },
  { id: "about", label: "Built in service" },
  { id: "contact", label: "Contact" },
] as const;

type IntroPhase = "ready" | "playing" | "hidden";

type NetworkInformationLike = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
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

function makeDistortionCurve(amount = 18) {
  const samples = 2048;
  const curve = new Float32Array(samples);

  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    curve[index] = ((3 + amount) * x * 20 * (Math.PI / 180)) /
      (Math.PI + amount * Math.abs(x));
  }

  return curve;
}

function hasSeenIntro() {
  try {
    if (window.sessionStorage?.getItem(INTRO_SESSION_KEY) === "1") return true;
  } catch {
    // Some privacy modes disable web storage.
  }

  return window.name.includes(INTRO_WINDOW_TOKEN);
}

function storeIntroSeen() {
  try {
    window.sessionStorage?.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // The browsing-context marker below preserves session behavior.
  }

  if (!window.name.includes(INTRO_WINDOW_TOKEN)) {
    window.name = `${window.name}${INTRO_WINDOW_TOKEN}`;
  }
}

export default function DrekiExperience() {
  const [introPhase, setIntroPhase] = useState<IntroPhase>("ready");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof SECTIONS)[number]["id"]>(
    SECTIONS[0].id,
  );

  const introRef = useRef<HTMLDivElement>(null);
  const soundButtonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introTimerRef = useRef<number | null>(null);
  const audioCloseTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const introVisible = introPhase !== "hidden";

  const stopRoar = useCallback(() => {
    if (audioCloseTimerRef.current !== null) {
      window.clearTimeout(audioCloseTimerRef.current);
      audioCloseTimerRef.current = null;
    }

    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }, []);

  const rememberIntro = useCallback(() => {
    storeIntroSeen();
  }, []);

  const completeIntro = useCallback(() => {
    if (introTimerRef.current !== null) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }

    stopRoar();
    rememberIntro();
    setIntroPhase("hidden");
  }, [rememberIntro, stopRoar]);

  const playRoar = useCallback(async () => {
    try {
      stopRoar();

      const AudioContextConstructor =
        window.AudioContext ??
        (window as WindowWithWebkitAudio).webkitAudioContext;

      if (!AudioContextConstructor) return;

      const context = new AudioContextConstructor();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        await context.resume();
      }

      const now = context.currentTime;
      const duration = 1.65;
      const sampleCount = Math.floor(context.sampleRate * duration);
      const noiseBuffer = context.createBuffer(1, sampleCount, context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);

      for (let index = 0; index < sampleCount; index += 1) {
        const falloff = 1 - index / sampleCount;
        noiseData[index] = (Math.random() * 2 - 1) * (0.35 + falloff * 0.65);
      }

      const noise = context.createBufferSource();
      const throatFilter = context.createBiquadFilter();
      const bodyFilter = context.createBiquadFilter();
      const distortion = context.createWaveShaper();
      const noiseGain = context.createGain();
      const sub = context.createOscillator();
      const subGain = context.createGain();
      const master = context.createGain();

      noise.buffer = noiseBuffer;
      throatFilter.type = "bandpass";
      throatFilter.Q.value = 1.7;
      throatFilter.frequency.setValueAtTime(720, now);
      throatFilter.frequency.exponentialRampToValueAtTime(180, now + duration);

      bodyFilter.type = "lowpass";
      bodyFilter.Q.value = 2.3;
      bodyFilter.frequency.setValueAtTime(1250, now);
      bodyFilter.frequency.exponentialRampToValueAtTime(260, now + duration);

      distortion.curve = makeDistortionCurve();
      distortion.oversample = "2x";

      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.72, now + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.28, now + 0.75);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      sub.type = "sawtooth";
      sub.frequency.setValueAtTime(54, now);
      sub.frequency.exponentialRampToValueAtTime(27, now + duration);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.exponentialRampToValueAtTime(0.28, now + 0.1);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.22, now + 0.06);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.06);

      noise.connect(throatFilter);
      throatFilter.connect(bodyFilter);
      bodyFilter.connect(distortion);
      distortion.connect(noiseGain);
      noiseGain.connect(master);
      sub.connect(subGain);
      subGain.connect(master);
      master.connect(context.destination);

      noise.start(now);
      sub.start(now);
      noise.stop(now + duration);
      sub.stop(now + duration);

      audioCloseTimerRef.current = window.setTimeout(() => {
        if (audioContextRef.current === context) {
          audioContextRef.current = null;
        }
        audioCloseTimerRef.current = null;
        void context.close().catch(() => undefined);
      }, Math.ceil((duration + 0.2) * 1000));
    } catch {
      stopRoar();
      // Audio is ornamental. Silent continuation is always available.
    }
  }, [stopRoar]);

  const startIntro = useCallback(
    (withSound: boolean) => {
      if (reducedMotion) {
        completeIntro();
        return;
      }

      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
      }

      setIntroPhase("playing");

      if (withSound) {
        void playRoar();
      } else {
        stopRoar();
      }

      introTimerRef.current = window.setTimeout(
        completeIntro,
        INTRO_DURATION_MS,
      );
    },
    [completeIntro, playRoar, reducedMotion, stopRoar],
  );

  const replayIntro = useCallback(() => {
    if (introTimerRef.current !== null) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    stopRoar();
    setIntroPhase("ready");
  }, [stopRoar]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preferenceFrame = window.requestAnimationFrame(() => {
      const seen = hasSeenIntro();

      setReducedMotion(motionQuery.matches);

      if (seen || motionQuery.matches) {
        if (motionQuery.matches) rememberIntro();
        setIntroPhase("hidden");
      }
    });

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      if (event.matches) {
        completeIntro();
      }
    };

    motionQuery.addEventListener("change", handleMotionPreference);
    return () => {
      window.cancelAnimationFrame(preferenceFrame);
      motionQuery.removeEventListener("change", handleMotionPreference);
    };
  }, [completeIntro, rememberIntro]);

  useEffect(() => {
    if (!introVisible) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.documentElement.classList.add("dreki-intro-open");

    const focusFrame = window.requestAnimationFrame(() => {
      soundButtonRef.current?.focus({ preventScroll: true });
    });

    const handleIntroKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        completeIntro();
        return;
      }

      if (event.key !== "Tab" || !introRef.current) return;

      const controls = Array.from(
        introRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (controls.length === 0) return;

      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleIntroKeyboard);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleIntroKeyboard);
      document.documentElement.classList.remove("dreki-intro-open");
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [completeIntro, introVisible]);

  useEffect(() => {
    return () => {
      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
      }
      stopRoar();
    };
  }, [stopRoar]);

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

      {!introVisible && !reducedMotion && (
        <button
          className="dreki-replay"
          type="button"
          onClick={replayIntro}
          data-testid="replay-intro"
        >
          Replay Intro
        </button>
      )}

      {introVisible && (
        <div
          ref={introRef}
          className={`dreki-intro dreki-intro--${introPhase}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dreki-intro-title"
          data-testid="intro"
        >
          <button
            className="dreki-intro__skip"
            type="button"
            onClick={completeIntro}
            aria-label="Skip opening sequence"
          >
            Skip
            <span aria-hidden="true"> / Esc</span>
          </button>

          <div className="dreki-intro__stage">
            <div className="dreki-intro__mark-shell">
              <Image
                className="dreki-intro__mark-image"
                src="/brand/dreki-icon-1024.webp"
                alt="Dreki Solutions dragon mark"
                width={1024}
                height={1024}
                priority
                unoptimized
              />
              <span className="dreki-intro__depths" aria-hidden="true">
                {[1, 2, 3, 4, 5, 6].map((layer) => (
                  <span
                    className={`dreki-intro__depth dreki-intro__depth--${layer}`}
                    key={layer}
                  />
                ))}
              </span>
            </div>

            <div className="dreki-intro__copy">
              <p className="dreki-intro__eyebrow">Dreki Solutions</p>
              <h2 className="dreki-intro__title" id="dreki-intro-title">
                Systems built to move work forward.
              </h2>
            </div>

            <div
              className="dreki-intro__controls"
              role="group"
              aria-label="Opening sequence options"
            >
              <button
                ref={soundButtonRef}
                className="dreki-intro__enter dreki-intro__enter--sound"
                type="button"
                onClick={() => startIntro(true)}
                disabled={introPhase === "playing"}
                data-testid="enter-sound"
              >
                Enter with sound
              </button>
              <button
                className="dreki-intro__enter dreki-intro__enter--silent"
                type="button"
                onClick={() => startIntro(false)}
                disabled={introPhase === "playing"}
                data-testid="continue-silent"
              >
                Continue silently
              </button>
            </div>

            <p className="dreki-intro__status" aria-live="polite">
              {introPhase === "playing" ? "Opening Dreki Solutions" : "Sound is optional"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
