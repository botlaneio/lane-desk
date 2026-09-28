export type LaneStatus = "Available" | "In development" | "In research";

export type Lane = {
  id: string;
  index: string;
  name: string;
  status: LaneStatus;
  headline: string;
  description: string;
  manualWork: string;
  href?: string;
};

// Lane Assist is the only live product. The others are directions: keep their copy to the problem, not features.
export const LANES: Lane[] = [
  {
    id: "lane-assist",
    index: "01",
    name: "Lane Assist",
    status: "Available",
    headline: "Customer support, handled.",
    description:
      "Lane Assist handles routine customer conversations for online stores and brings in a person when it shouldn’t answer.",
    manualWork: "Answering the same order, product and return questions on WhatsApp, all day.",
    href: "/assist",
  },
  {
    id: "lane-verify",
    index: "02",
    name: "Lane Verify",
    status: "In development",
    headline: "Documents checked. Books matched.",
    description:
      "Turn incoming purchase bills into validated records and surface the exceptions that need attention.",
    manualWork: "Keying purchase bills into Tally by hand, then matching the books against GST records.",
  },
  {
    id: "lane-engage",
    index: "03",
    name: "Lane Engage",
    status: "In research",
    headline: "Turn conversations into business.",
    description:
      "Structure B2B inquiries and orders that currently disappear across WhatsApp, spreadsheets and sales phones.",
    manualWork: "Copying orders, inquiries and quotes out of WhatsApp chats into spreadsheets and accounts.",
  },
  {
    id: "lane-settle",
    index: "04",
    name: "Lane Settle",
    status: "In research",
    headline: "Know where the money went.",
    description:
      "Reconcile orders, settlements, COD, returns, fees and deductions without rebuilding the truth in Excel.",
    manualWork: "Rebuilding what was actually received, and actually made, from settlement reports in Excel.",
  },
];
