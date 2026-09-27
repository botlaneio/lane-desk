import { CONTACT, External } from "@/components/external";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Lane Desk",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#the-guard", label: "Reply guard" },
      { href: "#handoff", label: "Handoff" },
    ],
  },
  {
    title: "Service",
    links: [
      { href: "#service", label: "Managed service" },
      { href: "#pricing", label: "Packages" },
      { href: "#pilot", label: "Pilot" },
    ],
  },
];

const linkClass =
  "rounded text-[15px] font-medium text-ink underline-offset-4 decoration-1 hover:underline focus-visible:underline";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="container-page grid gap-12 pt-16 pb-12 md:pt-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <Logo />
          <p className="t-sub mt-6">
            <span className="block">Managed support.</span>
            <span className="block">Verified answers.</span>
            <span className="block">A person when it matters.</span>
          </p>
          <p className="mt-6 max-w-[28rem] font-mono text-[12px] font-medium leading-relaxed tracking-[0.04em] text-ink-2">
            ON THE OFFICIAL WHATSAPP BUSINESS PLATFORM · FOR SHOPIFY AND WOOCOMMERCE STORES IN INDIA
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h2 className="t-eyebrow">{c.title}</h2>
              <ul className="mt-4 grid gap-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className={linkClass}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-1">
            <h2 className="t-eyebrow">Contact</h2>
            <ul className="mt-4 grid gap-3">
              <li>
                <External href={CONTACT} className={linkClass}>
                  Talk to us{" "}
                </External>
              </li>
              <li className="text-[14px] text-ink-2">botlane.in/contact</li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="container-page overflow-hidden" aria-hidden="true">
        <svg viewBox="0 0 1000 158" className="block w-full select-none" focusable="false">
          <text
            x="0"
            y="152"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            className="fill-ink font-sans"
            style={{ fontSize: 200, fontWeight: 700, letterSpacing: "-0.04em" }}
          >
            Lane Desk
          </text>
        </svg>
      </div>

      <div className="border-t border-hairline">
        <div className="container-page flex flex-col gap-3 py-5 font-mono text-[12px] font-medium tracking-[0.04em] text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BotLane LLC · Owned by Vedanta Ventures</p>
          <p>PRIVATE · MANAGED · HUMAN-CONTROLLED</p>
          <a href="#top" className="rounded text-ink-2 hover:text-ink">
            BACK TO TOP <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
