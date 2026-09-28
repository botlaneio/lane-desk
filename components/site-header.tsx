import { CONTACT, External } from "@/components/external";
import { Logo } from "@/components/logo";

export type NavItem = { href: string; label: string };

export function SiteHeader({
  variant,
  logoHref,
  nav,
  cta,
}: {
  variant: "botlane" | "assist";
  logoHref: string;
  nav: NavItem[];
  cta: string;
}) {
  return (
    <header id="top" className="sticky top-0 z-50 border-b border-hairline bg-surface">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo variant={variant} href={logoHref} />
        <nav aria-label="Primary" className={nav.length > 5 ? "hidden xl:block" : "hidden lg:block"}>
          <ul className="flex items-center gap-7">
            {nav.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded text-[15px] font-medium text-ink-2 hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <External href={CONTACT} className="btn btn-primary btn-sm">
          {cta}
        </External>
      </div>
    </header>
  );
}
