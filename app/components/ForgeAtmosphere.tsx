"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";

const preferenceKey = "dreki-background-paused";
const preferenceEvent = "dreki-background-change";
let sessionPaused = false;
let storageUnavailable = false;

function readPaused() {
  if (storageUnavailable) return sessionPaused;
  try {
    return window.localStorage.getItem(preferenceKey) === "true";
  } catch {
    return sessionPaused;
  }
}

function subscribePreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(preferenceEvent, onChange);
  };
}

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const serverPaused = () => true;
const readReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useMotionPreference() {
  const paused = useSyncExternalStore(subscribePreference, readPaused, serverPaused);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    serverPaused,
  );
  return { paused, reducedMotion, stopped: paused || reducedMotion };
}

export default function ForgeAtmosphere() {
  const { stopped } = useMotionPreference();
  const atmosphereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateVisibility = () => {
      if (atmosphereRef.current)
        atmosphereRef.current.dataset.inactive = String(document.hidden);
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return (
    <div
      ref={atmosphereRef}
      className="dreki-atmosphere"
      data-paused={stopped}
      aria-hidden="true"
    >
      <div className="dreki-flames">
        {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
      </div>
      <div className="dreki-embers">
        {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
      </div>
    </div>
  );
}

export function ForgeMotionControl() {
  const { paused, reducedMotion, stopped } = useMotionPreference();

  function toggleMotion() {
    sessionPaused = !paused;
    try {
      window.localStorage.setItem(preferenceKey, String(sessionPaused));
    } catch {
      // Keep the control working when browser storage is unavailable.
      storageUnavailable = true;
    }
    window.dispatchEvent(new Event(preferenceEvent));
  }

  return (
      <button
        type="button"
        className="dreki-motion-control"
        onClick={toggleMotion}
        disabled={reducedMotion}
        aria-label={reducedMotion ? "Background animation off: reduced motion enabled" : stopped ? "Play background animation" : "Pause background animation"}
        title={reducedMotion ? "Your device's reduced-motion preference is enabled" : stopped ? "Play background animation" : "Pause background animation"}
      >
        {stopped ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        <span>{reducedMotion ? "Reduced motion" : stopped ? "Motion paused" : "Pause motion"}</span>
      </button>
  );
}
