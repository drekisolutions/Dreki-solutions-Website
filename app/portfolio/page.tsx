import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import { Portfolio } from "../components/trades/TradesHome";
import { metadataFromRegistry } from "../content-registry";
export const metadata: Metadata = metadataFromRegistry("/portfolio");
export default function PortfolioPage() {
  return (
    <main id="main-content" className="forge-standalone">
      <MotionConfig reducedMotion="user" transition={{ duration: 0.6 }}>
        <Portfolio standalone />
      </MotionConfig>
    </main>
  );
}
