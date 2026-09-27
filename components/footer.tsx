import { CONTACT, External } from "@/components/external";
import { Logo } from "@/components/logo";

const BOTLANE = "https://www.botlane.io";

type Item = { label: string; href?: string; external?: boolean };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Product",
    items: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Reply guard", href: "#the-guard" },
      { label: "Handoff", href: "#handoff" },
      { label: "Managed service", href: "#service" },
    ],
  },
  {
    title: "Pricing",
    items: [
      { label: "Packages", href: "#pricing" },
      { label: "Pilot", href: "#pilot" },
      { label: "Launch offer", href: "#pilot" },
    ],
  },
  {
    title: "Works with",
    items: [
      { label: "WhatsApp Business Platform" },
      { label: "Shopify" },
      { label: "WooCommerce" },
      { label: "Shiprocket" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Trust", href: `${BOTLANE}/trust`, external: true },
      { label: "Privacy", href: `${BOTLANE}/privacy`, external: true },
      { label: "Terms", href: `${BOTLANE}/terms`, external: true },
      { label: "Refund", href: `${BOTLANE}/refund`, external: true },
    ],
  },
];

const PHONE = { display: "+1 307 218 5715", href: "tel:+13072185715" };
const WHATSAPP = { display: "+91 99799 72714", href: "https://wa.me/919979972714" };
const ADDRESS = "30 N Gould St, Ste R, Sheridan, WY 82801";

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5 shrink-0 stroke-ink-2"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const PIN = "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z";
const PHONE_ICON =
  "M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z";
const CHAT =
  "M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5ZM9 9.5c.3 2 1.8 3.6 3.9 4.3l1.2-1.2 1.9.8";

const SOCIAL = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/botlane",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.38 2.55 4.38 5.75V21h-4v-5.9c0-1.4 0-3.2-1.95-3.2s-2.25 1.5-2.25 3.1V21H9V9Z",
  },
  {
    name: "X",
    href: "https://x.com/botlane",
    path: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.57L16.67 19.2Z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/botlane",
    path: "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5-9.1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM8 2.5h8A5.5 5.5 0 0 1 21.5 8v8a5.5 5.5 0 0 1-5.5 5.5H8A5.5 5.5 0 0 1 2.5 16V8A5.5 5.5 0 0 1 8 2.5Zm0 1.7A3.8 3.8 0 0 0 4.2 8v8A3.8 3.8 0 0 0 8 19.8h8a3.8 3.8 0 0 0 3.8-3.8V8A3.8 3.8 0 0 0 16 4.2H8Z",
  },
];

const linkClass = "rounded text-[17px] text-ink-2 hover:text-ink hover:underline underline-offset-4";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="container-page pt-16 md:pt-20">
        <div className="max-w-[36rem]">
          <Logo />
          <p className="mt-6 text-[18px] leading-[1.55] text-ink-2 md:text-[20px]">
            Managed WhatsApp support for Indian online stores. Routine questions answered, every AI reply checked
            against your policy, and a person when it matters. Set up, run and reviewed by BotLane.
          </p>
          <External href={CONTACT} className="link mt-8 inline-flex items-center gap-2 text-[17px] font-medium">
            Talk to us{" "}
          </External>
        </div>

        <nav aria-label="Footer" className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-12">
          {COLUMNS.map((c) => (
            <div key={c.title} className="border-t border-hairline pt-6">
              <h2 className="font-mono text-[12px] font-medium tracking-[0.14em] text-ink-2 uppercase">{c.title}</h2>
              <ul className="mt-6 grid gap-5">
                {c.items.map((i) => (
                  <li key={i.label} className="text-[17px] text-ink-2">
                    {i.href && i.external ? (
                      <External href={i.href} className={linkClass}>
                        {i.label}{" "}
                      </External>
                    ) : i.href ? (
                      <a href={i.href} className={linkClass}>
                        {i.label}
                      </a>
                    ) : (
                      i.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-14 flex flex-col gap-4 border-t border-hairline py-8 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-10">
          <p className="flex items-center gap-3 text-[16px] text-ink">
            <Icon d={PIN} />
            {ADDRESS}
          </p>
          <a href={PHONE.href} className="flex items-center gap-3 rounded text-[16px] text-ink hover:underline underline-offset-4">
            <Icon d={PHONE_ICON} />
            <span className="sr-only">Phone: </span>
            {PHONE.display}
          </a>
          <External
            href={WHATSAPP.href}
            className="flex items-center gap-3 rounded text-[16px] text-ink hover:underline underline-offset-4"
          >
            <Icon d={CHAT} />
            <span className="sr-only">WhatsApp: </span>
            {WHATSAPP.display}{" "}
          </External>
          <ul className="flex gap-3 pt-2 lg:ml-auto lg:pt-0">
            {SOCIAL.map((x) => (
              <li key={x.name}>
                <a
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`BotLane on ${x.name} (opens in a new tab)`}
                  className="flex size-12 items-center justify-center rounded-btn border border-hairline bg-surface hover:bg-surface-2"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 fill-ink">
                    <path d={x.path} fillRule="evenodd" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="container-page flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink-2">
            © {new Date().getFullYear()} BotLane LLC · Owned by Vedanta Ventures
          </p>
          <p className="font-mono text-[12px] font-medium tracking-[0.14em] text-ink-2">
            PRIVATE · MANAGED · HUMAN-CONTROLLED
          </p>
        </div>
      </div>
    </footer>
  );
}
