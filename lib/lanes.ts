export type LaneStatus = "In development" | "In research";

export type Lane = {
  id: string;
  index: string;
  name: string;
  status: LaneStatus;
  headline: string;
  description: string;
  manualWork: string;
};

// None of these are launched. Keep their copy to the problem, not features, pricing or dates.
export const LANES: Lane[] = [
  {
    id: "lane-verify",
    index: "01",
    name: "Lane Verify",
    status: "In development",
    headline: "Documents checked. Books matched.",
    description:
      "Turn incoming purchase bills into validated records and surface the exceptions that need attention.",
    manualWork: "Keying purchase bills into Tally by hand, then matching the books against GST records.",
  },
  {
    id: "lane-engage",
    index: "02",
    name: "Lane Engage",
    status: "In research",
    headline: "Turn conversations into business.",
    description:
      "Structure B2B inquiries and orders that currently disappear across WhatsApp, spreadsheets and sales phones.",
    manualWork: "Copying orders, inquiries and quotes out of WhatsApp chats into spreadsheets and accounts.",
  },
  {
    id: "lane-settle",
    index: "03",
    name: "Lane Settle",
    status: "In research",
    headline: "Know where the money went.",
    description:
      "Reconcile orders, settlements, COD, returns, fees and deductions without rebuilding the truth in Excel.",
    manualWork: "Rebuilding what was actually received, and actually made, from settlement reports in Excel.",
  },
];
