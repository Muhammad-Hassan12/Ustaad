import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollProgress from "@/components/ScrollProgress";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const JSON_LD_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ustaad",
  alternateName: "Ustaad AI Career OS",
  url: "https://www.ustaad.systems",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  codeRepository: "https://github.com/Muhammad-Hassan12/Ustaad",
  description:
    "AI-powered Career Operating System for Pakistani tech talent — multi-agent DAG pipeline, grounded job-market intelligence, skill-gap analysis, ATS CV rewrite, and adaptive mock interviews.",
  author: {
    "@type": "Person",
    name: "Syed Muhammad Hassan",
    url: "https://www.smhassan.me/",
    sameAs: [
      "https://github.com/Muhammad-Hassan12",
      "https://www.linkedin.com/in/syed-muhammad-hassan-aa112928b/",
    ],
  },
  creator: {
    "@type": "Person",
    name: "Syed Muhammad Hassan",
    url: "https://www.smhassan.me/",
  },
  publisher: {
    "@type": "Organization",
    name: "AgenticEra Systems",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ustaad.systems"),
  title: "Ustaad (اُستاد) — Career Intelligence & OS for Tech Talent",
  description:
    "Upload your CV, analyze skill gaps, get personalized learning roadmaps, and practice mock interviews with Ustaad AI. Created by Syed Muhammad Hassan.",
  keywords: [
    "AI career coach",
    "Pakistan jobs",
    "CV optimization",
    "skill gap analysis",
    "mock interview",
    "Ustaad",
    "Syed Muhammad Hassan",
  ],
  authors: [{ name: "Syed Muhammad Hassan", url: "https://www.smhassan.me/" }],
  creator: "Syed Muhammad Hassan",
  publisher: "AgenticEra Systems",
  openGraph: {
    title: "Ustaad (اُستاد) — Career Intelligence & OS for Tech Talent",
    description:
      "AI Career OS for Pakistani tech graduates: grounded market intelligence, skill-gap analysis, 30/60/90 roadmap, ATS CV studio, and mock interviews. Built by Syed Muhammad Hassan.",
    url: "https://www.ustaad.systems",
    siteName: "Ustaad",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ustaad (اُستاد) — AI Career OS for Pakistani Tech Talent",
    description:
      "Grounded Pakistani job-market intelligence, skill-gap analysis, ATS CV studio, and AI mock interviews. Created by Syed Muhammad Hassan.",
  },
  icons: {
    icon: "/Favicon.png",
    shortcut: "/Favicon.png",
    apple: "/Favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="/Favicon.png" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SCHEMA) }}
        />
      </head>
      <body className="antialiased bg-ink text-parchment font-body min-h-screen flex flex-col selection:bg-brass selection:text-ink">
        <ScrollProgress />
        <Navbar />
        <div className="flex-1 flex flex-col">
          <ErrorBoundary fallbackMessage="An error occurred in the application. Please refresh the page.">
            {children}
          </ErrorBoundary>
        </div>
        <Footer />
      </body>
    </html>
  );
}
