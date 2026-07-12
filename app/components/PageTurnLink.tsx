"use client";

import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => {
    finished: Promise<void>;
  };
};

type PageTurnLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
  onNavigate?: () => void;
};

export default function PageTurnLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
  onNavigate,
}: PageTurnLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const resolveRouteRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!resolveRouteRef.current) return;
    const resolveFrame = window.requestAnimationFrame(() => {
      resolveRouteRef.current?.();
      resolveRouteRef.current = null;
    });
    return () => window.cancelAnimationFrame(resolveFrame);
  }, [pathname]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      resolveRouteRef.current?.();
      document.documentElement.removeAttribute("data-page-transition");
    },
    [],
  );

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const destination = new URL(href, window.location.href);
    if (destination.pathname === pathname) return;

    event.preventDefault();
    onNavigate?.();

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const viewTransitionDocument = document as ViewTransitionDocument;

    if (prefersReducedMotion) {
      router.push(href);
      return;
    }

    if (viewTransitionDocument.startViewTransition) {
      root.dataset.pageTransition = "native";
      const transition = viewTransitionDocument.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            resolveRouteRef.current = resolve;
            router.push(href);
            timeoutRef.current = window.setTimeout(resolve, 1200);
          }),
      );
      void transition.finished.finally(() => {
        root.removeAttribute("data-page-transition");
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      });
      return;
    }

    root.dataset.pageTransition = "fallback";
    timeoutRef.current = window.setTimeout(() => router.push(href), 280);
    window.setTimeout(() => root.removeAttribute("data-page-transition"), 760);
  };

  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
