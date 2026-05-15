import type { Metadata } from "next";
import NavBar from "./components/NavBar";
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
  title: "Leavigation | Leave Plan",
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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1TPH50KZ9N"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1TPH50KZ9N');
            `,
          }}
        />
        <script type="text/javascript" async src="https://subscribe-forms.beehiiv.com/attribution.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        <div className="flex min-h-screen flex-col">
          <NavBar />
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
                <p>
                  Information accurate as of May 2026. State laws and benefit rates change regularly. Always verify current details with your state agency or a qualified professional before making decisions. Confirm workplace details with your employer or HR team.
                </p>
                <p>This tool provides general information only and does not constitute legal, financial, or employment advice.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
