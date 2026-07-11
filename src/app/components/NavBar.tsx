"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import LeavigationLogo from "./LeavigationLogo";

const centerLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "How Leave Works", href: "/leave-guide" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "What's available today", href: "/product" },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/#how-it-works") {
    return pathname === "/";
  }
  const path = href.split("#")[0];
  if (!path || path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavLink({
  href,
  label,
  active,
  onClick,
  className = "",
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-pink-400 text-white"
          : "text-slate-600 hover:bg-pink-50 hover:text-pink-900"
      } ${className}`}
    >
      {label}
    </Link>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="no-print sticky top-0 z-50 border-b border-pink-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <LeavigationLogo />

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
          {centerLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isLinkActive(pathname, link.href)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                My dashboard
              </Link>
              <Link
                href="/plan"
                className="inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: "#F2B8CB" }}
              >
                Build my plan
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden sm:inline text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: "#F2B8CB" }}
              >
                Start Free
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <span className="text-xl leading-none" aria-hidden="true">
                ×
              </span>
            ) : (
              <span className="flex flex-col gap-1" aria-hidden="true">
                <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
                <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
                <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav-menu"
            className="relative z-50 border-t border-pink-50 bg-white px-4 py-4 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {centerLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={isLinkActive(pathname, link.href)}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left"
                />
              ))}
              {!isSignedIn && (
                <Link
                  href="/sign-in"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-900"
                >
                  Log In
                </Link>
              )}
              {isSignedIn && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-900"
                  >
                    My dashboard
                  </Link>
                  <Link
                    href="/plan"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: "#F2B8CB" }}
                  >
                    Build my plan
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
