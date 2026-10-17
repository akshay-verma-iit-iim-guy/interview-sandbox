// Change these first when you re-theme the sandbox for an interview prompt.
export const appConfig = {
  productName: "Service Desk",
  entity: { singular: "case", plural: "cases" },
  aiFeatureName: "Suggested reply",
  // Suggestions below this confidence go to a human instead of being used directly.
  confidenceThreshold: 0.7,
  currentUser: { id: "u_demo_agent", name: "Demo agent", role: "agent" },
} as const;
