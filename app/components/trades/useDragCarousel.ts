"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type PointerEvent,
} from "react";
import { animate, useReducedMotion } from "motion/react";

export function useDragCarousel(resetKey = "") {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const scrolling = useRef<{ stop: () => void } | null>(null);
  const drag = useRef<{ pointer: number; x: number; scroll: number } | null>(
    null,
  );
  const dragged = useRef(false);
  const geometry = useRef({ stride: 0, period: 0 });

  const wrap = useCallback((value: number) => {
    const period = geometry.current.period;
    return period
      ? 4 * period + ((((value - 4 * period) % period) + period) % period)
      : value;
  }, []);

  const stageCards = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const step = geometry.current.stride;
    if (!step) return;
    const midpoint = el.clientWidth / 2;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 24;
    // Use layout positions, not transformed bounds, so depth never changes snapping.
    for (let i = 0; i < el.children.length; i++) {
      const card = el.children[i] as HTMLElement;
      const distance =
        (i * step - el.scrollLeft + (step - gap) / 2 - midpoint) / step;
      const angle = Math.max(-1.5, Math.min(1.5, distance));
      const depth = Math.max(0, 1 - Math.abs(distance));
      card.style.setProperty("--card-angle", `${-angle * 24}deg`);
      card.style.setProperty("--card-scale", `${0.9 + depth * 0.18}`);
      card.style.setProperty("--card-depth", `${-28 + depth * 98}px`);
      // Pull neighboring cards inward so their edges sit behind the lead card.
      card.style.setProperty("--card-x", `${-angle * step * 0.2}px`);
      card.style.zIndex = String(Math.round(20 + depth * 20));
    }
  }, []);

  const normalize = useCallback(() => {
    const el = track.current;
    if (!el || !geometry.current.period) return;
    const next = wrap(el.scrollLeft);
    if (Math.abs(next - el.scrollLeft) > 1) el.scrollLeft = next;
    stageCards();
  }, [stageCards, wrap]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const originals = Array.from(el.children) as HTMLElement[];
    if (!originals.length) return;
    // The hook owns only these decorative copies. React continues to own the
    // original cards. Copies keep native links, but stay out of the tab order.
    function copy() {
      const fragment = document.createDocumentFragment();
      for (const source of originals) {
        const clone = source.cloneNode(true) as HTMLElement;
        clone.dataset.carouselClone = "true";
        clone.setAttribute("aria-hidden", "true");
        clone.removeAttribute("id");
        clone
          .querySelectorAll("[id]")
          .forEach((node) => node.removeAttribute("id"));
        clone
          .querySelectorAll<HTMLElement>(
            "a, button, input, select, textarea, [tabindex]",
          )
          .forEach((node) => {
            node.tabIndex = -1;
          });
        fragment.appendChild(clone);
      }
      return fragment;
    }
    el.prepend(copy(), copy(), copy(), copy());
    el.append(copy(), copy(), copy(), copy());
    el.dataset.loopReady = "true";
    const measure = () => {
      const oldStep = geometry.current.stride;
      const logical = oldStep
        ? el.scrollLeft / oldStep - 4 * originals.length
        : 0;
      const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 24;
      const step =
        Number.parseFloat(getComputedStyle(originals[0]).width) + gap;
      geometry.current = { stride: step, period: step * originals.length };
      el.scrollLeft = wrap((4 * originals.length + logical) * step);
      stageCards();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      scrolling.current?.stop();
      drag.current = null;
      el.querySelectorAll('[data-carousel-clone="true"]').forEach((clone) =>
        clone.remove(),
      );
      for (const card of originals) {
        card.style.removeProperty("--card-angle");
        card.style.removeProperty("--card-scale");
        card.style.removeProperty("--card-depth");
        card.style.removeProperty("--card-x");
        card.style.removeProperty("z-index");
      }
      delete el.dataset.loopReady;
      geometry.current = { stride: 0, period: 0 };
    };
  }, [resetKey, stageCards, wrap]);

  function slideTo(destination: number) {
    const el = track.current;
    if (!el) return;
    scrolling.current?.stop();
    if (reduced) {
      el.scrollLeft = wrap(destination);
      delete el.dataset.dragging;
      stageCards();
      return;
    }
    el.dataset.dragging = "true";
    scrolling.current = animate(el.scrollLeft, destination, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        el.scrollLeft = wrap(value);
        stageCards();
      },
      onComplete: () => {
        delete el.dataset.dragging;
        normalize();
      },
    });
  }

  function move(direction: number) {
    const el = track.current;
    const step = geometry.current.stride;
    if (el && step)
      slideTo((Math.round(el.scrollLeft / step) + direction) * step);
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    const el = event.currentTarget;
    if (el.hasPointerCapture(event.pointerId))
      el.releasePointerCapture(event.pointerId);
    if (dragged.current && geometry.current.stride)
      slideTo(
        Math.round(el.scrollLeft / geometry.current.stride) *
          geometry.current.stride,
      );
  }

  const handlers: HTMLAttributes<HTMLDivElement> = {
    onPointerDown(event) {
      if (event.button !== 0) return;
      scrolling.current?.stop();
      delete event.currentTarget.dataset.dragging;
      dragged.current = false;
      drag.current = {
        pointer: event.pointerId,
        x: event.clientX,
        scroll: event.currentTarget.scrollLeft,
      };
    },
    onPointerMove(event) {
      const start = drag.current;
      if (!start || start.pointer !== event.pointerId) return;
      const delta = event.clientX - start.x;
      if (Math.abs(delta) <= 4 && !dragged.current) return;
      dragged.current = true;
      event.currentTarget.dataset.dragging = "true";
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.scrollLeft = wrap(start.scroll - delta);
      stageCards();
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture(event) {
      if (drag.current?.pointer === event.pointerId) release(event);
    },
    onDragStart(event) {
      event.preventDefault();
    },
    onClickCapture(event) {
      if (dragged.current && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onKeyDown(event) {
      if (
        event.target !== event.currentTarget ||
        !["ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    },
    onScroll: normalize,
  };
  return { track, move, handlers };
}
