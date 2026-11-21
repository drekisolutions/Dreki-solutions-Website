"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import {
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Megaphone,
  Palette,
  SearchCheck,
  Wrench,
} from "lucide-react";
import AuditForm from "../../free-audit/AuditForm";
import { journalTopics, services, type JournalArticle } from "./content";
import NewsletterPopup from "../blog/NewsletterPopup";
import { useDragCarousel } from "./useDragCarousel";
import "./trades.css";

// Quarter stiffness and half damping preserve the spring shape at half speed.
const spring = { type: "spring" as const, stiffness: 45, damping: 12 };
const serviceIcons = [Megaphone, Palette, SearchCheck];
const networkPoints = [
  [115, 123],
  [490, 125],
  [527, 365],
  [300, 535],
  [75, 375],
];

function Reveal({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      whileInView={reduced ? {} : { y: [24, 0] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={spring}
    >
      {children}
    </motion.div>
  );
}

function Hero() {
  const target = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 25, damping: 15 });
  const foilPosition = useTransform(progress, [0, 1], ["0% 50%", "100% 50%"]);
  const logoScale = useTransform(progress, [0, 0.75], [1, 0.54]);
  const logoRotate = useTransform(progress, [0, 1], [-7, 0]);
  const networkOpacity = useTransform(progress, [0, 0.45], [0.12, 1]);
  const networkScale = useTransform(progress, [0, 0.65], [0.78, 1]);
  const lineLength = useTransform(progress, [0, 0.65], [0.05, 1]);
  return (
    <section className="forge-hero" ref={target} aria-labelledby="forge-title">
      <div className="forge-hero-sticky">
        <div className="forge-hero-top">
          <span>
            <i /> BUILT FOR SMALL BUSINESS. ENGINEERED FOR YOU.
          </span>
          <span className="forge-edition">DREKI / MARKETING &amp; BRAND</span>
        </div>
        <div className="forge-hero-layout">
          <div className="forge-hero-copy">
            <p className="forge-kicker">
              <span className="forge-rule" /> YOUR CRAFT. OUR CODE.
            </p>
            <h1 id="forge-title">
              Social media marketing and brand development for small
              businesses,{" "}
              <motion.span
                className="forge-foil"
                style={{
                  backgroundPosition: reduced ? "50% 50%" : foilPosition,
                }}
              >
                starting with a free audit
              </motion.span>
            </h1>
            <p className="forge-hero-lede">
              For owner-led small businesses: get found, look the part, and stay
              in front of customers. Start with a free digital presence audit.
            </p>
            <div className="forge-actions">
              <motion.a
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                href="#free-audit"
                className="forge-button"
              >
                Start with a free audit <ArrowUpRight size={18} />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                href="#services"
                className="forge-text-link"
              >
                See what we do <ArrowRight size={17} />
              </motion.a>
            </div>
            <div className="forge-hero-footnote">
              <Wrench size={15} />
              <span>
                Built toward more booked work. Results depend on your process and follow-up.
              </span>
            </div>
          </div>
          <div
            className="forge-network"
            role="img"
            aria-label="Dreki connects social media marketing, brand development, and a free digital presence audit. Scroll to assemble the network."
          >
            <div className="forge-orbit forge-orbit-one" />
            <div className="forge-orbit forge-orbit-two" />
            <span className="forge-coordinate">ONE CONNECTED PRESENCE</span>
            <motion.svg
              className="forge-connections"
              viewBox="0 0 600 600"
              style={{ opacity: reduced ? 1 : networkOpacity }}
              aria-hidden="true"
            >
              {services.map((service) => {
                const [x, y] = networkPoints[service.node];
                return (
                  <motion.path
                    key={service.short}
                    d={`M300 300 L${x} ${y}`}
                    style={{ pathLength: reduced ? 1 : lineLength }}
                  />
                );
              })}
            </motion.svg>
            <motion.div
              className="forge-logo-core"
              style={{
                scale: reduced ? 0.54 : logoScale,
                rotate: reduced ? 0 : logoRotate,
              }}
            >
              <Image
                src="/brand/dreki-network-mark.webp"
                alt=""
                width={1920}
                height={1920}
                unoptimized
                priority
                sizes="(max-width: 700px) 90vw, 48vw"
              />
              <div className="forge-logo-sheen" />
            </motion.div>
            <motion.div
              className="forge-nodes"
              style={{
                opacity: reduced ? 1 : networkOpacity,
                scale: reduced ? 1 : networkScale,
              }}
            >
              {services.map((service, i) => {
                const Icon = serviceIcons[i];
                return (
                  <div
                    className={`forge-node forge-node-${service.node}`}
                    key={service.short}
                  >
                    <Icon size={19} />
                    <span>{service.short}</span>
                    <small>0{i + 1}</small>
                  </div>
                );
              })}
            </motion.div>
            <span className="forge-network-caption">
              <span /> ONE BUSINESS. CONNECTED.
            </span>
          </div>
        </div>
        <a className="forge-scroll-cue" href="#services">
          <span className="forge-scroll-track">
            <motion.i style={{ scaleY: reduced ? 1 : progress }} />
          </span>
          <span>SEE WHAT WE DO</span>
          <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section
      className="forge-section forge-services"
      id="services"
      aria-labelledby="services-title"
    >
      <div className="forge-section-heading">
        <div>
          <p className="forge-kicker">01 / WHAT WE DO</p>
          <h2 id="services-title">
            Three ways we help{" "}
            <span className="forge-foil">small businesses get found.</span>
          </h2>
        </div>
        <p>
          Built for businesses where the owner still does the work
          <br />
          and has little time left for marketing.
        </p>
      </div>
      <div className="forge-services-grid">
        {services.map((service, i) => {
          const Icon = serviceIcons[i];
          return (
            <article className="forge-service-card" key={service.title}>
              <div className="forge-service-top">
                <Icon size={24} />
                <span className="forge-small-label">SERVICE / 0{i + 1}</span>
              </div>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
              {service.href && (
                <a className="forge-project-link" href={service.href}>
                  {service.cta} <ArrowUpRight size={17} />
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

const journalImages = {
  call: "blog-call",
  flow: "blog-flow",
  grid: "blog-grid",
  paper: "blog-paper",
};

function Journal({ articles }: { articles: JournalArticle[] }) {
  const { track, move, handlers } = useDragCarousel(JSON.stringify(articles));
  return (
    <section
      className="forge-section forge-journal"
      id="journal"
      aria-labelledby="journal-title"
    >
      <div className="forge-section-heading">
        <div>
          <p className="forge-kicker">02 / FROM THE WORKBENCH</p>
          <h2 id="journal-title">
            Ideas worth <span className="forge-foil">putting to work.</span>
          </h2>
        </div>
        <div className="forge-carousel-controls">
          <button
            type="button"
            aria-label="Previous articles"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next articles"
            onClick={() => move(1)}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      <p className="forge-journal-intro">
        Practical notes on marketing, branding, and being found online.
        {!articles.some((topic) => topic.href) &&
          " First articles coming soon."}
      </p>
      <div
        className="forge-journal-track"
        ref={track}
        tabIndex={0}
        role="region"
        aria-label="Blog articles carousel. Loops continuously. Click and hold to drag, or use the arrow keys."
        {...handlers}
      >
        {articles.map((topic) => (
          <article className="forge-journal-card" key={topic.number}>
            <div
              className={`forge-journal-art forge-card-photo forge-journal-${topic.motif}`}
              aria-hidden="true"
            >
              <Image
                src={`/images/cards/${journalImages[topic.motif]}.webp`}
                alt=""
                fill
                sizes="(max-width: 700px) 85vw, (max-width: 1100px) 50vw, 400px"
                draggable={false}
              />
            </div>
            <div className="forge-journal-card-copy">
              <span className="forge-small-label">{topic.category}</span>
              <h3>{topic.title}</h3>
              {topic.href ? (
                <motion.a
                  className="forge-project-link"
                  href={topic.href}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Read article <ArrowUpRight size={16} />
                  <span className="forge-sr-only">: {topic.title}</span>
                </motion.a>
              ) : (
                <span className="forge-coming-soon">
                  <i /> Coming soon
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="forge-journal-bottom">
        <span>NOTES FROM PEOPLE WHO BUILD.</span>
        <span>
          HOLD & DRAG TO EXPLORE <ArrowRight size={13} />
        </span>
      </div>
    </section>
  );
}

function HangingAudit() {
  const reduced = useReducedMotion();
  return (
    <section
      className="forge-section forge-audit"
      id="free-audit"
      aria-labelledby="audit-section-title"
    >
      <div className="forge-audit-copy">
        <p className="forge-kicker">03 / LET’S FIND YOUR NEXT MOVE</p>
        <h2 id="audit-section-title">
          Less busywork.
          <br />
          <span className="forge-foil">More business.</span>
        </h2>
        <p>
          Start with a free digital presence audit. See how customers find,
          trust, and contact your business—and where the experience could work
          harder for you.
        </p>
        <ul>
          <li>
            <Check size={17} /> A fresh look at your online presence
          </li>
          <li>
            <Check size={17} /> Friction in the path from interest to inquiry
          </li>
          <li>
            <Check size={17} /> Practical next steps for your business
          </li>
        </ul>
        <p className="forge-audit-followup">Your request goes to Brett at Dreki. He’ll follow up by email to confirm
          your business details and discuss the audit. You get practical recommendations;
          any paid work is a separate decision. No purchase required.</p>
        <div className="forge-audit-note">
          <span className="forge-foil">
            Built for people
            <br />
            who build things.
          </span>
          <ArrowUpRight size={35} />
        </div>
      </div>
      <div className="forge-tag-stage">
        <div className="forge-tag-rope" aria-hidden="true" />
        <motion.div
          className="forge-hanging-tag"
          initial={false}
          whileInView={
            reduced ? {} : { y: [-90, 0], rotate: [-3, 2, -1, 0.5, 0] }
          }
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 3.6, ease: "easeOut" }}
        >
          <div className="forge-tag-hole" aria-hidden="true" />
          <div className="forge-tag-heading">
            <span>DREKI / BUSINESS AUDIT</span>
            <span>COMPLIMENTARY</span>
          </div>
          <AuditForm />
          <div className="forge-tag-bottom">
            <span>YOUR NEXT CHAPTER STARTS HERE.</span>
            <span>↗</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function TradesHome({
  articles = journalTopics,
}: {
  articles?: JournalArticle[];
}) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.6 }}>
      <main className="forge-home" id="main-content">
        <Hero />
        <Reveal>
          <Services />
        </Reveal>
        <Reveal>
          <Journal articles={articles} />
        </Reveal>
        <HangingAudit />
        <NewsletterPopup />
      </main>
    </MotionConfig>
  );
}
