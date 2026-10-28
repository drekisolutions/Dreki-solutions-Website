"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { contact, navigation } from "../site-data";
import { siteConfig } from "../site-config";
import PageTurnLink from "./PageTurnLink";
import { ForgeMotionControl } from "./ForgeAtmosphere";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const form = document.getElementById("audit-request");
    if (!form) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAuditVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleMenuKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== "Tab") return;

      const menuLinks = Array.from(
        menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [],
      );
      const focusable = menuButtonRef.current
        ? [menuButtonRef.current, ...menuLinks]
        : menuLinks;

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!focusable.some((element) => element === active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleMenuKeyDown);
    document.body.dataset.menuOpen = "true";
    window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLAnchorElement>("a[href]")?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleMenuKeyDown);
      delete document.body.dataset.menuOpen;
    };
  }, [menuOpen]);

  if (pathname.startsWith("/admin"))
    return (
      <>
        <a className="skip-link" href="#main-content">
          Skip to editor
        </a>
        <div className="editor-motion-bar"><ForgeMotionControl /></div>
        {children}
      </>
    );

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header" aria-label="Primary">
        <PageTurnLink
          className="brand-link"
          href="/"
          aria-label="Dreki Solutions home"
        >
          <Image
            src="/brand/dreki-logo-horizontal-768.webp"
            alt="Dreki Solutions"
            width={768}
            height={231}
            priority
            unoptimized
          />
        </PageTurnLink>

        <div className="header-right">
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <PageTurnLink
                href={item.href}
                key={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </PageTurnLink>
            ))}
          </nav>
          <PageTurnLink
            className="header-cta"
            href={
              pathname === "/" ? "#free-audit" : siteConfig.primaryAction.href
            }
          >
            {siteConfig.primaryAction.label}
          </PageTurnLink>
          <ForgeMotionControl />
          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>

        <span className="header-divider" aria-hidden="true">
          <span className="header-divider__glare" key={pathname} />
        </span>
      </header>

      <nav
        ref={menuRef}
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        id="mobile-menu"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        {navigation.map((item, index) => (
          <PageTurnLink
            href={item.href}
            key={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onNavigate={() => setMenuOpen(false)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </PageTurnLink>
        ))}
      </nav>

      {children}

      <PageTurnLink
        className={`mobile-sticky-cta${auditVisible && (pathname === "/" || pathname === "/free-audit") ? " is-hidden" : ""}`}
        href={
          pathname === "/free-audit"
            ? "#audit-request"
            : pathname === "/"
              ? "#audit-request"
              : siteConfig.primaryAction.href
        }
        onNavigate={() => {
          if (pathname === "/free-audit") {
            document.getElementById("audit-request")?.scrollIntoView();
          }
        }}
      >
        {siteConfig.primaryAction.label}
      </PageTurnLink>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <PageTurnLink href="/" aria-label="Dreki Solutions home">
              <Image
                src="/brand/dreki-logo-horizontal-768.webp"
                alt="Dreki Solutions"
                width={768}
                height={231}
                unoptimized
              />
            </PageTurnLink>
            <p>Automation built for the trades.</p>
            <span>Your craft. Our code. A better-connected business.</span>
          </div>

          <nav className="footer-nav" aria-label="Footer navigation">
            <p>Capabilities</p>
            {navigation.map((item) => (
              <PageTurnLink href={item.href} key={item.href}>
                {item.label}
              </PageTurnLink>
            ))}
          </nav>

          <nav className="footer-nav" aria-label="Company navigation">
            <p>Company</p>
            <PageTurnLink href="/about">About</PageTurnLink>
            <PageTurnLink href="/engagements">Engagements</PageTurnLink>
            <PageTurnLink href="/contact">Contact</PageTurnLink>
            <PageTurnLink href="/free-audit">
              Free Digital Presence Audit
            </PageTurnLink>
            <PageTurnLink href="/privacy">Privacy</PageTurnLink>
            <PageTurnLink href="/terms">Terms</PageTurnLink>
            <PageTurnLink
              href="/#newsletter"
              onNavigate={() => {
                if (pathname === "/")
                  window.dispatchEvent(new Event("dreki-open-newsletter"));
              }}
            >
              Newsletter
            </PageTurnLink>
            <PageTurnLink href="/admin/blog">Owner editor</PageTurnLink>
          </nav>

          <div className="footer-contact">
            <p>Start a conversation</p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            <PageTurnLink
              href={
                pathname === "/" ? "#free-audit" : siteConfig.primaryAction.href
              }
            >
              {siteConfig.primaryAction.label}
            </PageTurnLink>
          </div>
        </div>

        <div className="footer-legal">
          <p>© 2026 Dreki Solutions LLC. All rights reserved.</p>
          <p>
            Dreki Solutions names, marks, original software concepts, and
            demonstration materials are proprietary to Dreki Solutions LLC
            unless otherwise stated. Unauthorized copying or redistribution is
            prohibited.
          </p>
          <p>
            Site information is general in nature and does not create a
            professional-services relationship.
          </p>
        </div>
      </footer>

      <div className="page-turn-curtain" aria-hidden="true">
        <span />
      </div>
    </>
  );
}
