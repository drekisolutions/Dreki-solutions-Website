"use client";

import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { GuardianCircuitStage } from "./stages";
import {
  createGuardianCircuitRuntime,
  type GuardianCircuitRuntime,
} from "./guardianCircuitRuntime";
import styles from "./guardian-circuit.module.css";

type EnhancementState = "checking" | "loading" | "ready" | "fallback";

type NetworkInformationLike = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

type GuardianCircuitClientProps = {
  stages: readonly GuardianCircuitStage[];
};

export default function GuardianCircuitClient({
  stages,
}: GuardianCircuitClientProps) {
  const [enhancementState, setEnhancementState] =
    useState<EnhancementState>("checking");
  const [selectedStage, setSelectedStage] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const runtimeRef = useRef<GuardianCircuitRuntime | null>(null);
  const selectedStageRef = useRef(0);

  useEffect(() => {
    selectedStageRef.current = selectedStage;
    runtimeRef.current?.selectStage(selectedStage);
  }, [selectedStage]);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!host || !viewport || !canvas) return;

    const finePointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const connection = (navigator as NavigatorWithConnection).connection;

    let cancelled = false;
    let visibleInViewport = false;
    let initializing = false;
    let initializationVersion = 0;
    let contextLost = false;

    const hasEligibleDevice = () =>
      finePointerQuery.matches &&
      !coarsePointerQuery.matches &&
      !reducedMotionQuery.matches &&
      !connection?.saveData &&
      !contextLost;

    const shouldRender = () =>
      visibleInViewport && document.visibilityState === "visible";

    const disposeRuntime = (loseContext = false) => {
      runtimeRef.current?.dispose(loseContext);
      runtimeRef.current = null;
    };

    const showFallback = () => {
      initializationVersion += 1;
      initializing = false;
      disposeRuntime();
      if (!cancelled) setEnhancementState("fallback");
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      showFallback();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);

    const initialize = async () => {
      if (
        cancelled ||
        initializing ||
        runtimeRef.current ||
        !shouldRender() ||
        !hasEligibleDevice()
      ) {
        return;
      }

      initializing = true;
      const version = ++initializationVersion;
      setEnhancementState("loading");

      const context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        depth: true,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: true,
      });

      if (!context) {
        showFallback();
        return;
      }

      try {
        const THREE = await import("three");
        if (
          cancelled ||
          version !== initializationVersion ||
          !shouldRender() ||
          !hasEligibleDevice()
        ) {
          initializing = false;
          return;
        }

        const runtime = createGuardianCircuitRuntime(THREE, {
          canvas,
          context,
          viewport,
          initialStage: selectedStageRef.current,
        });
        runtimeRef.current = runtime;
        runtime.setActive(true);
        initializing = false;
        setEnhancementState("ready");
      } catch {
        showFallback();
      }
    };

    const reconcileEligibility = () => {
      if (!hasEligibleDevice()) {
        showFallback();
        return;
      }

      runtimeRef.current?.setActive(shouldRender());
      if (shouldRender()) void initialize();
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleInViewport = Boolean(entry?.isIntersecting);
        runtimeRef.current?.setActive(shouldRender());
        if (shouldRender()) void initialize();
      },
      { rootMargin: "180px 0px", threshold: 0.01 },
    );
    intersectionObserver.observe(host);

    document.addEventListener("visibilitychange", reconcileEligibility);
    finePointerQuery.addEventListener("change", reconcileEligibility);
    coarsePointerQuery.addEventListener("change", reconcileEligibility);
    reducedMotionQuery.addEventListener("change", reconcileEligibility);
    connection?.addEventListener("change", reconcileEligibility);
    reconcileEligibility();

    return () => {
      cancelled = true;
      initializationVersion += 1;
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", reconcileEligibility);
      finePointerQuery.removeEventListener("change", reconcileEligibility);
      coarsePointerQuery.removeEventListener("change", reconcileEligibility);
      reducedMotionQuery.removeEventListener("change", reconcileEligibility);
      connection?.removeEventListener("change", reconcileEligibility);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      disposeRuntime(true);
    };
  }, []);

  const chooseStage = (index: number, moveFocus = false) => {
    setSelectedStage(index);
    if (moveFocus) {
      window.requestAnimationFrame(() => buttonRefs.current[index]?.focus());
    }
  };

  const handleStageKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % stages.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + stages.length) % stages.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = stages.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    chooseStage(nextIndex, true);
  };

  const activeStage = stages[selectedStage];

  return (
    <div
      ref={hostRef}
      className={styles.client}
      data-state={enhancementState}
      aria-hidden={enhancementState === "ready" ? undefined : true}
    >
      <div ref={viewportRef} className={styles.viewport}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className={styles.viewportChrome} aria-hidden="true">
          <span>Live guardrail model</span>
          <span>WebGL2 · on demand</span>
        </div>
        <div className={styles.activeReadout} aria-live="polite">
          <span>
            Checkpoint {String(selectedStage + 1).padStart(2, "0")} /{" "}
            {String(stages.length).padStart(2, "0")}
          </span>
          <strong>{activeStage.title}</strong>
          <p>{activeStage.description}</p>
        </div>
      </div>

      <ol className={styles.controls} aria-label="Guardian Circuit stages">
        {stages.map((stage, index) => {
          const isSelected = selectedStage === index;

          return (
            <li key={stage.title}>
              <button
                ref={(button) => {
                  buttonRefs.current[index] = button;
                }}
                type="button"
                className={styles.stageButton}
                aria-current={isSelected ? "step" : undefined}
                aria-pressed={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => chooseStage(index)}
                onKeyDown={(event) => handleStageKeyDown(event, index)}
              >
                <span className={styles.stageNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.stageButtonCopy}>
                  <strong>{stage.title}</strong>
                  <small>{stage.shortLabel}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
