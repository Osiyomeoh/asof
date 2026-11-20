import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Newsreader: an editorial serif — the wire-copy voice the claims are set in.
const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// IBM Plex Sans: the desk's interface type — plain, legible, unfussy.
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

// IBM Plex Mono: the machine/stamp voice — dates, scores, slug lines, verdicts.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AsOf: catch stale claims in AI answers",
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
      className={`${body.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <script
          // Sets the theme before first paint so there is no flash.
          // Reads the saved choice, else the OS preference; a daytime desk, so
          // light is the default and dark is used only when the OS asks for it.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('asof-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
