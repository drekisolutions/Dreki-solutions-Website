import type { Metadata } from "next";
import AgentDetailPage from "../../components/marketing/AgentDetailPage";
import { getAgentOffer, metadataFromRegistry } from "../../content-registry";

export const metadata: Metadata = metadataFromRegistry(
  "/agents/workflow-coordination",
);

export default function WorkflowCoordinationAgentPage() {
  return (
    <AgentDetailPage agent={getAgentOffer("workflow-coordination")} sequence="03" />
  );
}
