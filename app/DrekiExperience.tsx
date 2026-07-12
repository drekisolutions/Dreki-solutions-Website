"use client";

import { useEffect, useRef } from "react";

type NetworkInformationLike = EventTarget & { saveData?: boolean };
type NavigatorWithConnection = Navigator & { connection?: NetworkInformationLike };

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

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
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
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

        const strength = particle.life / particle.maxLife;
        const radius = particle.size * (0.65 + strength * 0.55);
        const glow = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          radius * 3.1,
        );
        const color = particle.ember ? "212, 118, 44" : "208, 166, 84";
        glow.addColorStop(0, `rgba(${color}, ${strength * 0.9})`);
        glow.addColorStop(0.45, `rgba(${color}, ${strength * 0.42})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(particle.x, particle.y, radius * 3.1, 0, Math.PI * 2);
        context.fill();
        nextParticles.push(particle);
      }

      context.globalCompositeOperation = "source-over";
      particles = nextParticles;
      if (particles.length > 0) animationFrame = window.requestAnimationFrame(drawTrail);
      else clearCanvas();
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
      if (particles.length > 72) particles = particles.slice(-72);
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(drawTrail);
    };

    const reconcileTrail = () => {
      const shouldEnable =
        !coarseQuery.matches &&
        !motionQuery.matches &&
        !connection?.saveData &&
        document.visibilityState === "visible";
      if (shouldEnable === enabled) return;
      enabled = shouldEnable;
      if (enabled) {
        resizeCanvas();
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
      } else {
        window.removeEventListener("pointermove", handlePointerMove);
        stopAnimation();
        root.style.setProperty("--cursor-x", "50vw");
        root.style.setProperty("--cursor-y", "50vh");
      }
    };

    const handleResize = () => enabled && resizeCanvas();
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

  return <canvas ref={canvasRef} className="dreki-cursor-canvas" aria-hidden="true" />;
}
