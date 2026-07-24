export type GuardianCircuitStage = {
  title: string;
  shortLabel: string;
  description: string;
};

export const guardianCircuitStages = [
  {
    title: "Trigger",
    shortLabel: "Signal received",
    description:
      "A customer request, schedule change, or internal signal starts the circuit.",
  },
  {
    title: "Agent prepares",
    shortLabel: "Draft prepared",
    description:
      "The agent gathers approved context and prepares the next useful step.",
  },
  {
    title: "Policy check",
    shortLabel: "Boundaries checked",
    description:
      "Rules, permissions, and confidence limits are checked before anything advances.",
  },
  {
    title: "Human approval",
    shortLabel: "Authority retained",
    description:
      "A person reviews the proposed action whenever judgment or authority is required.",
  },
  {
    title: "System action",
    shortLabel: "Action completed",
    description:
      "Approved work moves into the connected system with narrow permissions.",
  },
  {
    title: "Audit record",
    shortLabel: "Outcome recorded",
    description:
      "Inputs, approvals, outcomes, and exceptions are recorded for later review.",
  },
] as const satisfies readonly GuardianCircuitStage[];
