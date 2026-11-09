"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Inbox } from "lucide-react";

const stages = [
  { label: "New inquiry", title: "A customer needs a hand.",
    message: "“Can someone look at my leaking kitchen tap? I’m in Lansing and available Friday afternoon.”",
    note: "Sample customer message · Plumbing inquiry" },
  { label: "Job details", title: "The useful details, together.",
    message: "Job: leaking kitchen tap. Area: Lansing. Requested time: Friday afternoon.",
    note: "Still needed: service address and a callback number. Availability has not been checked." },
  { label: "Team review", title: "A clear next step for your team.",
    message: "Draft reply: “Thanks for reaching out. What’s the service address and best callback number? Our team will confirm availability before arranging a visit.”",
    note: "Ready for review · Nothing sent. No appointment booked." },
] as const;

export default function InquiryDemo() {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const current = stages[step];
  return (
    <section id="inquiry-demo" className="forge-section forge-inquiry" aria-labelledby="inquiry-title">
      <div className="forge-inquiry-copy">
        <p className="forge-kicker">A SMALL EXAMPLE / A CLEAR NEXT STEP</p>
        <h2 id="inquiry-title">From “can you help?”<br /><span className="forge-foil">to ready for review.</span></h2>
        <p>See how an inquiry can become an organized handoff, with your team deciding what happens next.</p>
        <p className="forge-prototype-label">Interactive prototype · Scripted sample, not a live agent or a client result. No messages are sent and no bookings are made.</p>
        <a href="#free-audit" className="forge-button">Start with a free audit <ArrowUpRight size={18} /></a>
        <details className="forge-demo-details">
          <summary>How would this fit my business?</summary>
          <p>We agree on the details to collect, the tools to connect, and what needs your approval. Unclear requests go to a person. A working connection and your team’s review are needed before anything goes live.</p>
        </details>
      </div>
      <div className="forge-inquiry-console">
        <div className="forge-inquiry-bar"><span><Inbox size={16} /> INQUIRY DESK</span><span>PROTOTYPE</span></div>
        <div className="forge-inquiry-steps" role="group" aria-label="Explore inquiry stages">
          {stages.map((stage, index) => (
            <motion.button key={stage.label} type="button" aria-pressed={step === index}
              onClick={() => setStep(index)} whileHover={{ y: -1 }} whileTap={{ scale: .96 }}>
              {step === index && <motion.span className="forge-inquiry-active" layoutId="inquiry-stage" />}
              <span className="forge-inquiry-number">{index < step ? <Check size={14} /> : `0${index + 1}`}</span>
              <span>{stage.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="forge-inquiry-scene" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -12 }}
              transition={{ duration: reduced ? 0 : .4 }}>
              <span className="forge-small-label">EXAMPLE / 0{step + 1}</span>
              <h3>{current.title}</h3><p className="forge-inquiry-message">{current.message}</p>
              <p className="forge-inquiry-note">{current.note}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="forge-inquiry-controls">
          <span>{step + 1} / {stages.length}</span>
          <motion.button className="forge-button" type="button" onClick={() => setStep((step + 1) % stages.length)}
            whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: .96 }}>
            {step === 2 ? "Replay example" : step === 0 ? "Collect the details" : "Prepare the handoff"}<ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
