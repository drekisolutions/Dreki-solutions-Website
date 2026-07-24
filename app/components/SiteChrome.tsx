"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { contact, navigation } from "../site-data";
import { siteConfig } from "../site-config";
import PageTurnLink from "./PageTurnLink";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

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

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header" aria-label="Primary">
        <PageTurnLink className="brand-link" href="/" aria-label="Dreki Solutions home">
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
          <PageTurnLink className="header-cta" href={siteConfig.primaryAction.href}>
            {siteConfig.primaryAction.label}
          </PageTurnLink>
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
        className="mobile-sticky-cta"
        href={siteConfig.primaryAction.href}
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
            <p>Governed AI agents for service-business operations.</p>
            <span>Systems move the work. People retain authority.</span>
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
            <PageTurnLink href="/privacy">Privacy</PageTurnLink>
          </nav>

          <div className="footer-contact">
            <p>Start a conversation</p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            <PageTurnLink href={siteConfig.primaryAction.href}>
              {siteConfig.primaryAction.label}
            </PageTurnLink>
          </div>
        </div>

        <div className="footer-legal">
          <p>© 2026 Dreki Solutions LLC. All rights reserved.</p>
          <p>
            Dreki Solutions names, marks, original software concepts, and demonstration
            materials are proprietary to Dreki Solutions LLC unless otherwise stated.
            Unauthorized copying or redistribution is prohibited.
          </p>
          <p>
            Site information is general in nature and does not create a professional-services relationship.
          </p>
        </div>
      </footer>

      <div className="page-turn-curtain" aria-hidden="true">
        <span />
      </div>
    </>
  );
}
