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

export const metadata: Metadata = {
  title: "Ustaad (اُستاد) — Career Intelligence & OS for Tech Talent",
  description:
    "Upload your CV, analyze skill gaps, get personalized learning roadmaps, and practice mock interviews with Ustaad AI.",
  keywords: ["AI career coach", "Pakistan jobs", "CV optimization", "skill gap analysis", "mock interview", "Ustaad"],
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
