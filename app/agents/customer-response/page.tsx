import type { Metadata } from "next";
import AgentDetailPage from "../../components/marketing/AgentDetailPage";
import { getAgentOffer, metadataFromRegistry } from "../../content-registry";

export const metadata: Metadata = metadataFromRegistry("/agents/customer-response");

export default function CustomerResponseAgentPage() {
  return <AgentDetailPage agent={getAgentOffer("customer-response")} sequence="01" />;
}
