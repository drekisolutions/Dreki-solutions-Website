"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
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
  CalendarDays,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Inbox,
  PhoneCall,
  Wrench,
} from "lucide-react";
import AuditForm from "../../free-audit/AuditForm";
import {
  journalTopics,
  projects,
  workflows,
  type JournalArticle,
} from "./content";
import NewsletterPopup from "../blog/NewsletterPopup";
import { useDragCarousel } from "./useDragCarousel";
import "./trades.css";

// Quarter stiffness and half damping preserve the spring shape at half speed.
const spring = { type: "spring" as const, stiffness: 45, damping: 12 };
const icons = [PhoneCall, Inbox, CalendarDays, FileText, FileCheck2];

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
            <i /> BUILT FOR THE TRADES. ENGINEERED FOR YOU.
          </span>
          <span className="forge-edition">DREKI / CONNECTED OPERATIONS</span>
        </div>
        <div className="forge-hero-layout">
          <div className="forge-hero-copy">
            <p className="forge-kicker">
              <span className="forge-rule" /> YOUR CRAFT. OUR CODE.
            </p>
            <h1 id="forge-title">
              You build.
              <br />
              We{" "}
              <motion.span
                className="forge-foil"
                style={{
                  backgroundPosition: reduced ? "50% 50%" : foilPosition,
                }}
              >
                connect
                <br className="forge-title-break" /> the rest.
              </motion.span>
            </h1>
            <p className="forge-hero-lede">
              Automation built for the trades. From the first missed call to the
              final invoice, put the busywork in its place.
            </p>
            <div className="forge-actions">
              <motion.a
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                href="#free-audit"
                className="forge-button"
              >
                Get my free audit <ArrowUpRight size={18} />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                href="#work"
                className="forge-text-link"
              >
                See what we build <ArrowRight size={17} />
              </motion.a>
            </div>
            <div className="forge-hero-footnote">
              <Wrench size={15} />
              <span>
                Built around your business. With your team in control.
              </span>
            </div>
          </div>
          <div
            className="forge-network"
            role="img"
            aria-label="Dreki connects missed-call follow-up, lead intake, scheduling, estimates, and invoicing. Scroll to assemble the network."
          >
            <div className="forge-orbit forge-orbit-one" />
            <div className="forge-orbit forge-orbit-two" />
            <span className="forge-coordinate">CONNECTED OPERATIONS</span>
            <motion.svg
              className="forge-connections"
              viewBox="0 0 600 600"
              style={{ opacity: reduced ? 1 : networkOpacity }}
              aria-hidden="true"
            >
              {[
                [115, 123],
                [490, 125],
                [527, 365],
                [300, 535],
                [75, 375],
              ].map(([x, y], i) => (
                <motion.path
                  key={i}
                  d={`M300 300 L${x} ${y}`}
                  style={{ pathLength: reduced ? 1 : lineLength }}
                />
              ))}
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
              {workflows.map((flow, i) => {
                const Icon = icons[i];
                return (
                  <div
                    className={`forge-node forge-node-${i}`}
                    key={flow.short}
                  >
                    <Icon size={19} />
                    <span>{flow.short}</span>
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
        <a className="forge-scroll-cue" href="#systems">
          <span className="forge-scroll-track">
            <motion.i style={{ scaleY: reduced ? 1 : progress }} />
          </span>
          <span>SCROLL TO CONNECT THE DOTS</span>
          <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}

function Systems() {
  const [active, setActive] = useState(0);
  const flow = workflows[active];
  const Icon = icons[active];
  return (
    <section
      className="forge-section forge-systems"
      id="systems"
      aria-labelledby="systems-title"
    >
      <div className="forge-section-heading">
        <div>
          <p className="forge-kicker">01 / THE CONNECTED BUSINESS</p>
          <h2 id="systems-title">
            Good at your trade.
            <br />
            <span className="forge-muted">Buried in everything else?</span>
          </h2>
        </div>
        <p>
          The tools should work together.
          <br />
          So you can get back to the work you do best.
        </p>
      </div>
      <div className="forge-system-layout">
        <div
          className="forge-workflow-tabs"
          role="tablist"
          aria-label="Automation workflows"
          aria-orientation="vertical"
        >
          {workflows.map((item, i) => {
            const TabIcon = icons[i];
            return (
              <motion.button
                key={item.title}
                type="button"
                role="tab"
                id={`workflow-tab-${i}`}
                aria-selected={active === i}
                aria-controls="workflow-panel"
                tabIndex={active === i ? 0 : -1}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActive(i)}
                onKeyDown={(event) => {
                  let next = i;
                  if (event.key === "ArrowDown") next = (i + 1) % 5;
                  else if (event.key === "ArrowUp") next = (i + 4) % 5;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = 4;
                  else return;
                  event.preventDefault();
                  setActive(next);
                  document.getElementById(`workflow-tab-${next}`)?.focus();
                }}
                className={active === i ? "is-active" : ""}
              >
                {active === i && (
                  <motion.span
                    className="forge-tab-highlight"
                    layoutId="workflow-highlight"
                    transition={spring}
                  />
                )}
                <span className="forge-tab-number">0{i + 1}</span>
                <TabIcon size={18} />
                <span>{item.title}</span>
                <ChevronRight size={16} />
              </motion.button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          id="workflow-panel"
          aria-labelledby={`workflow-tab-${active}`}
          tabIndex={0}
          className="forge-workflow-panel"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.36 }}
            >
              <div className="forge-flow-icon">
                <Icon size={28} />
              </div>
              <span className="forge-small-label">
                WORKFLOW / 0{active + 1}
              </span>
              <h3>{flow.label}</h3>
              <p>{flow.copy}</p>
              <div className="forge-flow-steps">
                {flow.steps.map((step, i) => (
                  <div key={step}>
                    <span>{i === 2 ? <Check size={14} /> : `0${i + 1}`}</span>
                    <p>{step}</p>
                    {i < 2 && <ArrowRight size={14} />}
                  </div>
                ))}
              </div>
              <small className="forge-demo-label">
                Illustrative workflow · Designed around your tools and approval
                rules.
              </small>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const projectImages: Record<string, string> = {
  content: "old-dog-product",
  print: "sea-wolf",
  roof: "roofbid",
  clip: "hook-and-clip",
  desk: "foreman",
};
const journalImages = {
  call: "blog-call",
  flow: "blog-flow",
  grid: "blog-grid",
  paper: "blog-paper",
};

function ProjectArt({ visual, name }: { visual: string; name: string }) {
  return (
    <div className={`forge-project-art forge-card-photo forge-art-${visual}`} aria-hidden="true">
      <Image
        src={`/images/cards/${projectImages[visual]}.webp`}
        alt=""
        fill
        sizes="(max-width: 700px) 85vw, (max-width: 1100px) 50vw, 400px"
        draggable={false}
      />
      <span className="forge-art-caption">
        {name} / {visual === "content" ? "product photography" : "concept imagery"}
      </span>
    </div>
  );
}

function SpotlightCard({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const background = useTransform(
    () =>
      `radial-gradient(400px circle at ${x.get()}px ${y.get()}px, rgba(216,177,90,.10), transparent 75%)`,
  );
  return (
    <motion.article
      className="forge-project-card"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      whileHover={{ y: -4 }}
      transition={spring}
    >
      <motion.div className="forge-card-spotlight" style={{ background }} />
      {children}
    </motion.article>
  );
}

export function Portfolio({ standalone = false }: { standalone?: boolean }) {
  const [filter, setFilter] = useState("all");
  const { track, move, handlers } = useDragCarousel(filter);
  return (
    <section
      className="forge-section forge-portfolio"
      id="work"
      aria-labelledby="work-title"
    >
      <div className="forge-section-heading">
        <div>
          <p className="forge-kicker">02 / SELECTED WORK</p>
          {standalone ? (
            <h1 id="work-title">
              Built to do <span className="forge-foil">real work.</span>
            </h1>
          ) : (
            <h2 id="work-title">
              Built to do <span className="forge-foil">real work.</span>
            </h2>
          )}
        </div>
        <p>
          Client projects. Our own products.
          <br />
          Different businesses. The same builder’s mindset.
        </p>
      </div>
      <div className="forge-portfolio-controls">
        <div
          className="forge-filter-group"
          role="group"
          aria-label="Filter portfolio"
        >
          {[
            ["all", "All work"],
            ["client", "Client projects"],
            ["dreki", "Dreki products"],
          ].map(([key, label]) => (
            <motion.button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              {filter === key && (
                <motion.span layoutId="portfolio-filter" transition={spring} />
              )}
              {label}
            </motion.button>
          ))}
        </div>
        <div className="forge-carousel-controls">
          <button
            type="button"
            aria-label="Previous projects"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next projects"
            onClick={() => move(1)}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      <div
        className="forge-project-grid forge-project-track"
        key={filter}
        ref={track}
        tabIndex={0}
        role="region"
        aria-label="Portfolio carousel. Loops continuously. Click and hold to drag, or use the arrow keys."
        {...handlers}
      >
        {projects
          .filter((p) => filter === "all" || p.kind === filter)
          .map((p) => (
            <SpotlightCard key={p.name}>
              <ProjectArt visual={p.visual} name={p.name} />
              <div className="forge-project-info">
                <div className="forge-project-meta">
                  <span>{p.category}</span>
                  <span>/{p.number}</span>
                </div>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <div className="forge-project-tags">
                  {p.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                {p.href && (
                  <motion.a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="forge-project-link"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {p.cta}
                    <ArrowUpRight size={17} />
                    <span className="forge-sr-only"> (opens in a new tab)</span>
                  </motion.a>
                )}
              </div>
            </SpotlightCard>
          ))}
      </div>
      <div className="forge-journal-bottom">
        <span>CLIENT PROJECTS / DREKI PRODUCTS</span>
        <span>
          HOLD &amp; DRAG TO EXPLORE <ArrowRight size={13} />
        </span>
      </div>
    </section>
  );
}

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
          <p className="forge-kicker">03 / FROM THE WORKBENCH</p>
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
        Practical notes on automation and running a trade business.
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
        <p className="forge-kicker">04 / LET’S FIND YOUR NEXT MOVE</p>
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
        <div className="forge-trades-strip">
          <span>FOR THE PEOPLE WHO KEEP THINGS RUNNING</span>
          <div>
            <span>ROOFING</span>
            <i />
            <span>HVAC</span>
            <i />
            <span>PLUMBING</span>
            <i />
            <span>ELECTRICAL</span>
            <i />
            <span>THE SKILLED TRADES</span>
          </div>
        </div>
        <Reveal>
          <Systems />
        </Reveal>
        <Reveal>
          <Portfolio />
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
