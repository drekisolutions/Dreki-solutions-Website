import type { Metadata } from "next";
import AgentDetailPage from "../../components/marketing/AgentDetailPage";
import { getAgentOffer, metadataFromRegistry } from "../../content-registry";

export const metadata: Metadata = metadataFromRegistry(
  "/agents/intake-and-scheduling",
);

export default function IntakeAndSchedulingAgentPage() {
  return (
    <AgentDetailPage agent={getAgentOffer("intake-and-scheduling")} sequence="02" />
  );
}
