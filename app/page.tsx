import type { Metadata } from "next";
import { CONTACT, External } from "@/components/external";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header";
import { Arrow, Check, Eyebrow, rise } from "@/components/ui";
import { LANES, type Lane } from "@/lib/lanes";

const TITLE = "BotLane: software for the work that still gets done manually";
const DESCRIPTION =
  "BotLane builds and operates focused software for Indian businesses, removing repetitive operational work from WhatsApp, spreadsheets and disconnected systems.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BotLane",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const NAV = [
  { href: "#products", label: "Products" },
  { href: "/assist", label: "Lane Assist" },
  { href: "#how", label: "How we build" },
  { href: "#india", label: "India" },
];

const SYSTEMS = ["WhatsApp", "Excel", "Tally", "GST portal", "Marketplaces and payments"];
const MANUAL_STEPS = ["Copy", "Re-enter", "Match", "Reconcile"];

const STEPS = [
  ["Find the manual work", "We start with the repetitive work your team does around the software you already have."],
  [
    "Build around what already works",
    "A lane connects to your existing systems. Your system of record stays where it is.",
  ],
  [
    "Operate it with you",
    "Where a product needs it, setup, monitoring and exceptions stay with us, and we keep improving the workflow.",
  ],
];

const INDIA = [
  ["GST and Tally", "Books here run on GST rules and Tally. We build around both instead of asking you to leave them."],
  ["WhatsApp first", "Orders, questions and approvals already happen on WhatsApp. That is where the work starts."],
  ["UPI, COD and payouts", "Money arrives by UPI, card, COD and marketplace payout, each on its own cycle."],
  [
    "Indian marketplaces",
    "Marketplace fees, returns and RTO are the starting point, not an edge case.",
  ],
  ["Priced in rupees", "Plain ₹ pricing. The Lane Assist pilot is ₹6,999/month, with setup scoped separately."],
  ["A person at the exception", "When software reaches something it shouldn’t decide, a person takes it. By design."],
];

const MANAGED = [
  "Configure the system",
  "Connect the tools you already use",
  "Set the operating rules with you",
  "Monitor exceptions",
  "Review what went wrong",
  "Improve the workflow over time",
];

function StatusChip({ status }: { status: Lane["status"] }) {
  return <span className={`chip ${status === "Available" ? "chip-held" : "chip-planned"}`}>{status}</span>;
}

function LaneBody({ lane }: { lane: Lane }) {
  return (
    <>
      <div className="lg:col-span-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2">{lane.index}</span>
          <StatusChip status={lane.status} />
        </div>
        <h3 className="mt-2 text-[24px] leading-tight font-semibold tracking-[-0.02em] md:mt-3 md:text-[32px]">{lane.name}</h3>
      </div>
      <div className="lg:col-span-5">
        <p className="text-[18px] leading-snug font-semibold tracking-[-0.01em] md:text-[20px]">{lane.headline}</p>
        <p className="mt-2 text-[16px] text-ink-2">{lane.description}</p>
        <p className="mt-5 font-mono text-[11px] font-medium tracking-[0.06em] text-ink-2">THE MANUAL WORK</p>
        <p className="mt-1.5 text-[15px] text-ink">{lane.manualWork}</p>
      </div>
    </>
  );
}

export default function Home() {
  const [assist, ...concepts] = LANES;

  return (
    <>
      <SiteHeader variant="botlane" logoHref="/" nav={NAV} cta="Talk to BotLane" />

      <main id="main" tabIndex={-1} className="outline-none">
        {/* 1 · Hero */}
        <section aria-labelledby="hero-title" className="container-page pt-12 pb-16 md:pt-20 md:pb-24">
          <p className="t-eyebrow rise" style={rise(0)}>
            BOTLANE / 01 · INDIA
          </p>
          <h1 id="hero-title" className="t-display mt-5 max-w-[20ch]">
            {[
              ["Software", "for", "the", "work"],
              ["that", "still", "gets", "done"],
              ["manually."],
            ].map((line, l) => (
              <span key={l} className="md:block">
                {line.map((w, k) => (
                  <span key={w}>
                    <span className="rise inline-block" style={rise(1 + (l * 4 + k) * 0.4)}>
                      {w}
                    </span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div className="mt-8 grid gap-12 md:mt-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <p className="rise max-w-[34rem] text-[18px] leading-[1.5] text-ink-2 md:text-[20px]" style={rise(5)}>
                BotLane builds and operates focused software for Indian businesses, removing repetitive operational
                work from WhatsApp, spreadsheets and disconnected systems.
              </p>
              <div className="btn-pair rise mt-8 flex flex-nowrap gap-3" style={rise(5.5)}>
                <a href="#products" className="btn btn-primary">
                  Explore products
                </a>
                <External href={CONTACT} className="btn btn-secondary">
                  Talk to BotLane
                </External>
              </div>
            </div>

            <nav
              aria-label="Products"
              className="rise hidden lg:col-span-4 lg:col-start-9 lg:block"
              style={rise(6)}
            >
              <p className="font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2">THE LANES</p>
              <ol className="mt-3 divide-y divide-hairline border-y border-hairline">
                {LANES.map((l) => (
                  <li key={l.id}>
                    <a
                      href={l.href ?? `#${l.id}`}
                      className="flex items-center justify-between gap-4 rounded py-3 hover:text-ink"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-[12px] font-medium text-ink-2">{l.index}</span>
                        <span className="text-[16px] font-medium">{l.name}</span>
                      </span>
                      <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2 uppercase">
                        {l.status}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </section>

        {/* 2 · The gap */}
        <section id="gap" aria-labelledby="gap-title" className="border-y border-hairline bg-surface">
          <div className="section container-page">
            <Reveal className="max-w-[44rem]">
              <Eyebrow>02 / THE GAP</Eyebrow>
              <h2 id="gap-title" className="t-heading mt-4">
                <span className="md:block">You already have software.</span>{" "}
                <span className="md:block">The manual work is still there.</span>
              </h2>
              <p className="mt-4 text-[18px] text-ink-2">
                Accounting software, WhatsApp, marketplaces, payment systems and spreadsheets each do their job.
                Between them, people still copy, match, check and chase information by hand. BotLane builds for that
                gap.
              </p>
            </Reveal>

            <Reveal className="mt-10">
              <ol
                aria-label="Where the manual work happens"
                className="grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center"
              >
                {SYSTEMS.map((s, i) => (
                  <li key={s} className="contents">
                    <span className="card flex items-center justify-center px-4 py-2.5 text-center text-[15px] font-semibold lg:min-h-20 lg:py-3 lg:text-[16px]">
                      {s}
                    </span>
                    {i < MANUAL_STEPS.length ? (
                      <span className="flex items-center justify-center gap-3 py-1.5 lg:flex-col lg:gap-2 lg:px-3 lg:py-0">
                        <span className="relative flex h-5 w-px items-center justify-center bg-border lg:order-2 lg:h-px lg:w-14">
                          <span
                            aria-hidden="true"
                            className="flow-dot-y absolute size-1.5 rounded-full bg-ink lg:hidden"
                            style={{ "--d": `${i * 450}ms` } as React.CSSProperties}
                          />
                          <span
                            aria-hidden="true"
                            className="flow-dot absolute hidden size-1.5 rounded-full bg-ink lg:block"
                            style={{ "--d": `${i * 450}ms` } as React.CSSProperties}
                          />
                        </span>
                        <span className="chip chip-held lg:order-1">
                          <span className="sr-only">Manual step: </span>
                          {MANUAL_STEPS[i]}
                        </span>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-6 font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2">
                EVERY STEP BETWEEN TWO SYSTEMS IS SOMEONE ON YOUR TEAM.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 3 · Products */}
        <section id="products" aria-labelledby="products-title" className="section container-page">
          <Reveal className="max-w-[44rem]">
            <Eyebrow>03 / PRODUCTS</Eyebrow>
            <h2 id="products-title" className="t-heading mt-4">
              Built for the work between systems.
            </h2>
            <p className="mt-4 text-[18px] text-ink-2">
              Each lane takes over one narrow, repetitive piece of operational work, next to the software you already
              run.
            </p>
          </Reveal>

          <ol className="mt-10">
            <li id={assist.id} className="scroll-mt-24">
              <Reveal className="card grid gap-4 p-6 md:gap-6 md:p-8 lg:grid-cols-12 lg:gap-8">
                <LaneBody lane={assist} />
                <div className="flex flex-col gap-4 lg:col-span-3 lg:items-end lg:justify-between lg:text-right">
                  <ul className="flex flex-wrap gap-1.5 lg:justify-end" aria-label="How Lane Assist behaves">
                    {["Number matched", "Guard passed", "Person when needed"].map((c) => (
                      <li
                        key={c}
                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2 uppercase"
                      >
                        <span aria-hidden="true" className="text-verified">
                          ✓
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3 lg:items-end">
                    <p className="font-mono text-[12px] font-medium tracking-[0.04em] text-ink-2">
                      PILOT · ₹6,999/MONTH
                    </p>
                    <a href={assist.href} className="btn btn-dark">
                      Explore Lane Assist <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              </Reveal>
            </li>

            {concepts.map((lane) => (
              <li key={lane.id} id={lane.id} className="scroll-mt-24">
                <Reveal className="grid gap-3 border-b border-hairline px-6 py-6 md:gap-4 md:px-8 md:py-8 lg:grid-cols-12 lg:gap-8">
                  <LaneBody lane={lane} />
                  <div className="lg:col-span-3 lg:flex lg:items-end lg:justify-end">
                    <External href={CONTACT} className="link inline-flex items-center gap-1 text-[15px] font-medium">
                      Tell us about this work
                    </External>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <p className="mt-6 px-6 font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2 md:px-8">
            MORE LANES ARE BEING BUILT.
          </p>
        </section>

        {/* 4 · How BotLane builds */}
        <section id="how" aria-labelledby="how-title" className="border-t border-hairline bg-surface-2">
          <div className="section container-page">
            <Reveal className="max-w-[44rem]">
              <Eyebrow>04 / HOW BOTLANE BUILDS</Eyebrow>
              <h2 id="how-title" className="t-heading mt-4">
                One lane at a time.
              </h2>
              <p className="mt-4 text-[18px] text-ink-2">
                Not another system to migrate to. Focused software that takes one piece of work off your team.
              </p>
            </Reveal>

            <Reveal className="mt-10 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-4">
              {STEPS.map(([t, d], i) => (
                <div key={t} className="contents">
                  <div className="card">
                    <p className="font-mono text-[12px] font-medium tracking-[0.04em] text-ink-2">0{i + 1}</p>
                    <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.01em]">{t}</h3>
                    <p className="mt-1.5 text-[15px] text-ink-2">{d}</p>
                  </div>
                  {i < STEPS.length - 1 ? <Arrow delay={i * 900} /> : null}
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* 5 · India */}
        <section id="india" aria-labelledby="india-title" className="section container-page">
          <Reveal className="max-w-[44rem]">
            <Eyebrow>05 / INDIA</Eyebrow>
            <h2 id="india-title" className="t-heading mt-4">
              Built around how business actually works here.
            </h2>
          </Reveal>

          <Reveal className="mt-10">
            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {INDIA.map(([t, d]) => (
                <li key={t} className="border-t border-hairline pt-5">
                  <h3 className="font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2 uppercase">{t}</h3>
                  <p className="mt-2 text-[16px] text-ink">{d}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* 6 · Managed software */}
        <section id="managed" aria-labelledby="managed-title" className="border-y border-hairline bg-surface">
          <div className="section container-page grid gap-12 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-5">
              <Eyebrow>06 / MANAGED SOFTWARE</Eyebrow>
              <h2 id="managed-title" className="t-heading mt-4">
                Software shouldn&rsquo;t become another thing you have to manage.
              </h2>
              <p className="mt-4 text-[18px] text-ink-2">
                Where a product needs it, BotLane runs it with you. Focused software, plus the operational layer that
                makes it reliably useful, not one more subscription to look after.
              </p>
            </Reveal>

            <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.08}>
              <h3 className="font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2">
                DEPENDING ON THE PRODUCT, BOTLANE MAY
              </h3>
              <ul className="mt-4 grid divide-y divide-hairline border-y border-hairline sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 sm:border-b-0">
                {MANAGED.map((t) => (
                  <li key={t} className="flex gap-3 py-3 text-[16px] sm:border-b sm:border-hairline">
                    <Check />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[15px] text-ink-2">
                Lane Assist runs this way today: BotLane sets it up, writes the policy rules with the store and reviews
                held replies and handoffs every week.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 7 · Closing (the one ink band) */}
        <section aria-labelledby="closing-title" className="bg-ink text-on-ink">
          <div className="section container-page">
            <Reveal className="max-w-[46rem]">
              <h2 id="closing-title" className="t-heading">
                <span className="md:block">There&rsquo;s probably a manual lane</span>{" "}
                <span className="md:block">in your business we can take over.</span>
              </h2>
              <div className="btn-pair mt-8 flex flex-nowrap gap-3">
                <External href={CONTACT} className="btn btn-primary">
                  Talk to BotLane
                </External>
                <a href="#products" className="btn btn-secondary">
                  Explore products
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
