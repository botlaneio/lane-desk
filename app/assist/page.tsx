import type { Metadata } from "next";
import { Bubble, FlowCard } from "@/components/chat";
import { CONTACT, External } from "@/components/external";
import { Footer } from "@/components/footer";
import { HeroChat } from "@/components/hero-chat";
import { LogoMark } from "@/components/logo";
import { Replay } from "@/components/replay";
import { Reveal } from "@/components/reveal";
import { RouteCycler, type Route } from "@/components/route-cycler";
import { SiteHeader } from "@/components/site-header";
import { Arrow, Check, Eyebrow, rise } from "@/components/ui";

const TITLE = "Lane Assist: managed WhatsApp support for Indian online stores";
const DESCRIPTION =
  "Lane Assist answers routine WhatsApp questions, checks every AI reply against your store policy, and hands the hard conversations to a person. Run for you by BotLane.";

const NAV = [
  { href: "/#products", label: "All products" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#the-guard", label: "Reply guard" },
  { href: "#service", label: "Managed service" },
  { href: "#pricing", label: "Pricing" },
  { href: "#pilot", label: "Pilot" },
];

const ROUTES: Route[] = [
  {
    name: "Order status",
    example: "Where's my order?",
    path: "Store lookup, only after the WhatsApp number matches the order.",
    llm: false,
  },
  {
    name: "Product question",
    example: "Does this come in XL?",
    path: "AI draft from your catalogue, checked by the reply guard.",
    llm: true,
  },
  {
    name: "Returns or policy",
    example: "Can I still return this?",
    path: "AI draft from your policy wording. Day counts are done in code.",
    llm: true,
  },
  {
    name: "Wants a person",
    example: "Let me talk to someone.",
    path: "Handoff to the owner with the whole chat. Angry customers go here too.",
    llm: false,
  },
  {
    name: "Unclear",
    example: "hello??",
    path: "Asks one clarifying question before doing anything else.",
    llm: false,
  },
];

const PACKAGES = [
  {
    name: "Starter",
    monthly: "₹6,999",
    setup: "₹14,999 setup",
    channels: "WhatsApp",
    note: "The pilot runs on Starter.",
    from: false,
    button: "btn-secondary",
  },
  {
    name: "Growth",
    monthly: "₹14,999",
    setup: "₹24,999 setup",
    channels: "WhatsApp, Instagram DMs and website chat",
    note: "For stores that hear from customers on more than one channel.",
    from: false,
    button: "btn-dark",
  },
  {
    name: "Pro",
    monthly: "₹29,999",
    setup: "From ₹49,999 setup",
    channels: "Custom scope",
    note: "Scoped with you. Talk to us about what you need.",
    from: true,
    button: "btn-secondary",
  },
];

const INCLUDED = [
  "The official WhatsApp Business Platform, not the consumer app",
  "Order lookups in Shopify, WooCommerce or Shiprocket, after the number matches",
  "The reply guard on every AI-written draft",
  "Handoff to your phone or inbox with the whole chat",
  "A weekly review of held replies and handoffs with BotLane",
  "A weekly WhatsApp report",
];


export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/assist" },
  openGraph: {
    type: "website",
    url: "/assist",
    siteName: "BotLane",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function LaneAssistPage() {
  return (
    <>
      <SiteHeader variant="assist" logoHref="/assist" nav={NAV} cta="Talk to us" />

      <main id="main" tabIndex={-1} className="outline-none">
        {/* 1 · Hero */}
        <section aria-labelledby="hero-title" className="container-page pt-12 pb-16 md:pt-20 md:pb-24">
          <p className="t-eyebrow rise" style={rise(0)}>
            LANE / 01 · MANAGED SUPPORT
          </p>
          <h1 id="hero-title" className="t-display mt-5 max-w-[18ch]">
            {[["Support", "that", "knows"], ["when", "to", "hand", "over."]].map((line, l) => (
              <span key={l} className="md:block">
                {line.map((w, k) => (
                  <span key={w}>
                    <span className="rise inline-block" style={rise(1 + (l * 3 + k) * 0.5)}>
                      {w}
                    </span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div className="mt-8 grid gap-12 md:mt-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <p className="rise max-w-[34rem] text-[18px] leading-[1.5] text-ink-2 md:text-[20px]" style={rise(4.5)}>
                Lane Assist answers the routine WhatsApp questions, checks what it says against your store policy, and
                sends the hard conversations to a person.
              </p>
              <div className="btn-pair rise mt-8 flex flex-nowrap gap-3" style={rise(5)}>
                <External href={CONTACT} className="btn btn-primary">
                  Talk to us
                </External>
                <a href="#how-it-works" className="btn btn-secondary">
                  See how it works
                </a>
              </div>
              <p className="rise mt-8 font-mono text-[12px] font-medium tracking-[0.04em] text-ink-2" style={rise(5.5)}>
                FOR SHOPIFY AND WOOCOMMERCE STORES IN INDIA
              </p>
            </div>

            <div className="rise lg:col-span-6 lg:col-start-7" style={rise(5)}>
              <HeroChat />
            </div>
          </div>
        </section>

        {/* 2 · Signal strip */}
        <section aria-labelledby="signals-title" className="border-y border-hairline bg-surface">
          <h2 id="signals-title" className="sr-only">
            How Lane Assist behaves
          </h2>
          <ul className="container-page grid divide-y divide-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              "Order lookups only after the WhatsApp number matches",
              "Every AI draft checked before it’s sent",
              "A person when it matters",
            ].map((s, i) => (
              <li key={s} className="flex items-start gap-4 py-6 md:px-6 md:py-8 md:first:pl-0">
                <span className="font-mono text-[12px] font-medium text-ink-2">0{i + 1}</span>
                <span className="text-[17px] font-medium leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3 · How it works */}
        <section id="how-it-works" aria-labelledby="how-title" className="section container-page">
          <Reveal className="max-w-[44rem]">
            <Eyebrow>02 / HOW IT WORKS</Eyebrow>
            <h2 id="how-title" className="t-heading mt-4">
              Every message takes one of five routes.
            </h2>
            <p className="mt-4 text-[18px] text-ink-2">
              One cheap classification call sorts each message. Only product and policy questions reach an AI model,
              and those drafts pass the reply guard before anyone sees them.
            </p>
          </Reveal>

          <Reveal className="mt-10 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-4">
            {[
              ["Message in", "A customer writes to your WhatsApp Business number."],
              ["Sort", "One cheap classification call picks the route."],
              ["Route", "A lookup, an AI draft, a handoff or a question back."],
            ].map(([t, d], i, arr) => (
              <div key={t} className="contents">
                <div className="card">
                  <p className="font-mono text-[12px] font-medium tracking-[0.04em] text-ink-2">STEP {i + 1}</p>
                  <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.01em]">{t}</h3>
                  <p className="mt-1.5 text-[15px] text-ink-2">{d}</p>
                </div>
                {i < arr.length - 1 ? <Arrow delay={i * 900} /> : null}
              </div>
            ))}
          </Reveal>

          <Reveal className="mt-4">
            <h3 className="sr-only">The five routes</h3>
            <RouteCycler routes={ROUTES} />
          </Reveal>
        </section>

        {/* 4 · Reply guard */}
        <section id="the-guard" aria-labelledby="guard-title" className="border-t border-hairline bg-surface-2">
          <div className="section container-page grid gap-12 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-5">
              <Eyebrow>03 / THE REPLY GUARD</Eyebrow>
              <h2 id="guard-title" className="t-heading mt-4">
                Every AI draft is checked before your customer sees it.
              </h2>
              <p className="mt-4 text-[18px] text-ink-2">
                The guard compares each draft with your approved policy wording and the order data. If a draft
                promises something your store doesn&rsquo;t, it&rsquo;s held for a person.
              </p>
              <h3 className="mt-8 font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2">
                A DRAFT IS HELD IF IT PROMISES
              </h3>
              <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
                {[
                  "A discount your store doesn’t offer",
                  "A refund outside your policy window",
                  "A delivery date that isn’t in the order data",
                ].map((h) => (
                  <li key={h} className="flex items-center gap-3 py-3.5 text-[16px] font-medium">
                    <span className="chip chip-held">Held</span>
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="lg:col-span-7" delay={0.08}>
              <Replay className="grid gap-5 sm:grid-cols-2" every={9000}>
                <FlowCard title="Draft held">
                  <Bubble from="customer" at={0}>
                    My order came late. Can I get something off?
                  </Bubble>
                  <Bubble
                    from="desk"
                    at={500}
                    scanAt={1000}
                    metaAt={2000}
                    meta={
                      <>
                        <span className="chip chip-held">Held</span>
                        <span className="text-[13px] font-medium text-ink-2">
                          Discount not in store policy. Sent to a person.
                        </span>
                      </>
                    }
                  >
                    <span className="mb-1 block font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">
                      AI DRAFT · NOT SENT
                    </span>
                    <span className="relative block">
                      <span className="text-ink-2">So sorry! Here&rsquo;s 20% off your next order.</span>
                      <span
                        aria-hidden="true"
                        className="fade absolute inset-0 text-transparent line-through decoration-ink decoration-[1.5px]"
                        style={{ "--d": "1900ms" } as React.CSSProperties}
                      >
                        So sorry! Here&rsquo;s 20% off your next order.
                      </span>
                    </span>
                  </Bubble>
                </FlowCard>

                <FlowCard title="Draft passed">
                  <Bubble from="customer" at={200}>
                    Can I return these? They arrived 5 days ago.
                  </Bubble>
                  <Bubble
                    from="desk"
                    at={700}
                    scanAt={1200}
                    metaAt={2100}
                    meta={
                      <>
                        <span className="chip chip-verified">
                          <span aria-hidden="true">✓</span> Verified
                        </span>
                        <span className="text-[13px] font-medium text-ink-2">Matches policy. Days counted in code.</span>
                      </>
                    }
                  >
                    <span className="mb-1 block font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">
                      AI DRAFT · SENT
                    </span>
                    Yes. Returns are open for 7 days from delivery, so you have 2 days left. Reply RETURN to start.
                  </Bubble>
                </FlowCard>
              </Replay>
            </Reveal>
          </div>
        </section>

        {/* 5 · Handoff */}
        <section id="handoff" aria-labelledby="handoff-title" className="section container-page">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-5">
              <Eyebrow>HANDOFF</Eyebrow>
              <h2 id="handoff-title" className="t-heading mt-4">
                When it&rsquo;s hard, a person takes over.
              </h2>
              <p className="mt-4 text-[18px] text-ink-2">
                The conversation goes to the owner&rsquo;s phone or inbox with the whole chat, so the customer never
                has to repeat themselves.
              </p>
              <ul className="mt-8 grid gap-2.5">
                {[
                  "The customer asks for a person",
                  "The customer is angry",
                  "An order lookup fails",
                  "The system isn’t confident",
                ].map((t) => (
                  <li key={t} className="card flex items-center gap-3 px-4 py-3.5 text-[16px] font-medium">
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      focusable="false"
                      className="size-4 shrink-0 stroke-ink"
                      fill="none"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.08}>
              <Replay every={9000}>
              <FlowCard title="Handoff to the owner">
                <Bubble from="customer" at={0}>
                  This is the second wrong item. I want to speak to someone.
                </Bubble>
                <Bubble
                  from="desk"
                  at={800}
                  metaAt={1300}
                  meta={
                    <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">
                      FIXED MESSAGE · NO LLM
                    </span>
                  }
                >
                  I&rsquo;m sorry about this. I&rsquo;ve passed your chat to the store team. They can see everything
                  you&rsquo;ve sent, so you won&rsquo;t need to repeat it.
                </Bubble>
                <div
                  className="seq mt-2 rounded-[10px] border border-hairline bg-surface p-4"
                  style={{ "--d": "2000ms" } as React.CSSProperties}
                >
                  <p className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">
                    TO THE OWNER · WHATSAPP
                  </p>
                  <p className="mt-2 text-[15px] font-semibold">Customer asked for a person</p>
                  <p className="mt-1 text-[14px] text-ink-2">Order #1187 · 6 messages · full chat attached</p>
                </div>
              </FlowCard>
              </Replay>
            </Reveal>
          </div>
        </section>

        {/* 6 · Managed service */}
        <section id="service" aria-labelledby="service-title" className="border-t border-hairline bg-surface">
          <div className="section container-page">
            <Reveal className="max-w-[44rem]">
              <Eyebrow>04 / MANAGED SERVICE</Eyebrow>
              <h2 id="service-title" className="t-heading mt-4">
                You don&rsquo;t set up a bot. BotLane runs it for you.
              </h2>
              <p className="mt-4 text-[18px] text-ink-2">
                We set Lane Assist up with you, then keep it right as your store changes.
              </p>
            </Reveal>

            <Reveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Connected on one call",
                  "We connect your Shopify or WooCommerce store, Shiprocket and your WhatsApp Business number.",
                ],
                ["Policy wording and thresholds", "We write the approved policy wording and set the thresholds with you."],
                ["Reviewed every week", "We go through held replies and handoffs every week."],
                ["Kept current", "We update things when your catalogue, policy or sale season changes."],
              ].map(([t, d], i) => (
                <div key={t} className="card lift flex flex-col bg-paper shadow-none">
                  <span className="font-mono text-[12px] font-medium text-ink-2">0{i + 1}</span>
                  <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.01em]">{t}</h3>
                  <p className="mt-2 text-[15px] text-ink-2">{d}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="card flex flex-col gap-2 bg-paper shadow-none">
                <h3 className="text-[18px] font-semibold tracking-[-0.01em]">A weekly report on WhatsApp</h3>
                <p className="text-[15px] text-ink-2">
                  Chats handled, the share answered without a human, handoffs, and which replies were held and why.
                </p>
              </div>
              <div className="card flex flex-col gap-3 bg-paper shadow-none">
                <p className="flex gap-2.5 text-[15px]">
                  <Check />
                  Runs on the official WhatsApp Business Platform, not the consumer app.
                </p>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pl-[26px] text-[15px]">
                  Replies in Hindi and Hinglish
                  <span className="chip chip-planned">Planned</span>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 7 · Packages */}
        <section id="pricing" aria-labelledby="pricing-title" className="section container-page">
          <Reveal className="max-w-[44rem]">
            <Eyebrow>05 / PACKAGES</Eyebrow>
            <h2 id="pricing-title" className="t-heading mt-4">
              Three packages, priced in rupees.
            </h2>
            <p className="mt-4 text-[18px] text-ink-2">
              Each package is a monthly fee plus a setup fee. BotLane runs every one of them.
            </p>
          </Reveal>

          <Reveal className="mt-10 grid gap-4 lg:grid-cols-3">
            {PACKAGES.map((p) => (
              <div key={p.name} className="card lift flex flex-col">
                <h3 className="text-[18px] font-semibold">{p.name}</h3>
                <p className="mt-1 text-[15px] text-ink-2">{p.channels}</p>
                <p className="mt-6 flex items-baseline gap-1.5">
                  {p.from ? <span className="text-[15px] font-medium text-ink-2">from</span> : null}
                  <span className="text-[40px] font-bold leading-none tracking-[-0.03em]">{p.monthly}</span>
                  <span className="text-[15px] font-medium text-ink-2">/month</span>
                </p>
                <p className="mt-2 font-mono text-[12px] font-medium tracking-[0.04em] text-ink-2">
                  {p.setup.toUpperCase()}
                </p>
                <p className="mt-6 border-t border-hairline pt-4 text-[15px] text-ink-2">{p.note}</p>
                <External href={CONTACT} className={`btn ${p.button} mt-6 w-full`}>
                  Talk to us
                </External>
              </div>
            ))}
          </Reveal>

          <Reveal className="mt-4">
            <div className="card">
              <h3 className="font-mono text-[12px] font-medium tracking-[0.06em] text-ink-2">IN EVERY PACKAGE</h3>
              <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
                {INCLUDED.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[15px]">
                    <Check />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        {/* 8 · Pilot (the one ink band) */}
        <section id="pilot" aria-labelledby="pilot-title" className="bg-ink text-on-ink">
          <div className="section container-page grid gap-12 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-6">
              <Eyebrow onInk>06 / PILOT</Eyebrow>
              <h2 id="pilot-title" className="t-heading mt-4">
                Start with a pilot.
              </h2>
              <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                <span className="text-[48px] font-bold leading-none tracking-[-0.03em]">₹6,999</span>
                <span className="text-[18px] font-medium text-on-ink-2">/month, setup scoped separately.</span>
              </p>
              <div className="mt-8 rounded-card border border-ink-line p-5">
                <p className="font-mono text-[12px] font-medium tracking-[0.06em] text-on-ink-2">
                  LAUNCH OFFER · FIRST 5 PILOTS
                </p>
                <p className="mt-2 text-[17px] font-medium leading-snug">
                  Setup waived and 50% off for 60 days, in exchange for a case study.
                </p>
              </div>
              <External href={CONTACT} className="btn btn-primary mt-8">
                Talk about a pilot
              </External>
            </Reveal>

            <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.08}>
              <h3 className="font-mono text-[12px] font-medium tracking-[0.06em] text-on-ink-2">THE PILOT INCLUDES</h3>
              <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line">
                {[
                  "Lane Assist on your WhatsApp Business number",
                  "Order lookups after the WhatsApp number matches",
                  "Answers from your approved policy wording",
                  "The reply guard on every AI draft",
                  "Handoff to your phone or inbox with the whole chat",
                  "Weekly review of held replies and handoffs",
                  "A weekly WhatsApp report",
                ].map((t) => (
                  <li key={t} className="flex gap-3 py-3 text-[16px]">
                    <Check onInk />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* 9 · Closing */}
        <section aria-labelledby="closing-title" className="section container-page">
          <Reveal className="mx-auto flex max-w-[46rem] flex-col items-center text-center">
            <LogoMark className="size-10" />
            <h2 id="closing-title" className="t-heading mt-6">
              Fast answers, safe answers, and a human when it matters.
            </h2>
            <p className="mt-4 text-[18px] text-ink-2">
              Tell us about your store and how many WhatsApp messages you get in a month.
            </p>
            <External href={CONTACT} className="btn btn-dark mt-8">
              Talk to us
            </External>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
