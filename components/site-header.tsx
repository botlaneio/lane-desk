import { CONTACT, External } from "@/components/external";
import { HeaderBackdrop } from "@/components/header-backdrop";
import { Logo } from "@/components/logo";

export type NavItem = { href: string; label: string };

export function SiteHeader({
  logoHref,
  nav,
  cta,
}: {
  logoHref: string;
  nav: NavItem[];
  cta: string;
}) {
  return (
    <header id="top" className="sticky top-0 z-50">
      <HeaderBackdrop />
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Logo variant="wordmark" href={logoHref} />
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
