import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AsOf — catch stale claims in AI answers",
  description:
    "AsOf finds outdated claims (prices, API versions, regulations) in AI-generated answers and proves them against live web sources. Bifrost gateway + Tavily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (wallets, writing tools)
    // inject attributes on <html>/<body> before React hydrates; without this
    // the mismatch can defer client state from painting until first interaction.
    <html
      lang="en"
      className={`${body.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <script
          // Sets the theme before first paint so there is no dark-to-light flash.
          // Reads the saved choice, else the OS preference; falls back to dark.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('asof-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
