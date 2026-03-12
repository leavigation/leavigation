import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leavigation — Leave Plan",
  description: "Map your parental leave week by week: medical recovery, state benefits, and employer policies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appName = "Leavigation";
  const year = 2026;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="no-print border-t border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-600">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 text-[11px] sm:text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-700">© {year} {appName}</span>
                <span className="text-slate-300">|</span>
                <nav className="flex flex-wrap items-center gap-2">
                  <a href="/legal" className="hover:text-slate-900">
                    Legal Disclaimer
                  </a>
                  <span className="text-slate-300">|</span>
                  <a href="mailto:leavigation@gmail.com" className="hover:text-slate-900">
                    Contact
                  </a>
                </nav>
              </div>
              <div className="text-right text-[10px] leading-snug text-slate-500">
                <p>This tool provides general information only and does not constitute legal, financial, or employment advice.</p>
                <p>Laws change frequently — always verify with your employer and a qualified professional.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
