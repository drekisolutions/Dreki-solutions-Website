"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import DrekiExperience from "../DrekiExperience";
import { contact, navigation } from "../site-data";
import PageTurnLink from "./PageTurnLink";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <DrekiExperience />

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
          <PageTurnLink className="header-cta" href="/contact#consultation">
            Schedule a consultation
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

      <footer className="site-footer">
        <PageTurnLink href="/" aria-label="Dreki Solutions home">
          <Image
            src="/brand/dreki-logo-horizontal-768.webp"
            alt="Dreki Solutions"
            width={768}
            height={231}
            unoptimized
          />
        </PageTurnLink>
        <div className="footer-copy">
          <p>Custom agent systems for service and aviation operations.</p>
          <span>Built for service. Governed by people.</span>
        </div>
        <div className="footer-contact">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
        </div>
      </footer>

      <div className="page-turn-curtain" aria-hidden="true">
        <span />
      </div>
    </>
  );
}
