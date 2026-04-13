"use client";
import { usePathname } from "next/navigation";

const links = [
  { label: "Home", href: "/" },
  { label: "Build My Plan", href: "/plan" },
  { label: "How Leave Works", href: "/leave-guide" },
  { label: "Why Leavigation", href: "/why-leavigation" },
  { label: "About", href: "/about" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold">L</div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Leavigation</span>
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
        <a
          href="/plan"
          className="md:hidden inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          Build my plan →
        </a>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex gap-1 overflow-x-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <a
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "bg-sky-500 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </header>
  );
}
