import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Ustaad — AI Career OS for Pakistani Tech Talent",
  description:
    "Upload your CV, analyze skill gaps, get personalized learning roadmaps, and practice mock interviews with AI.",
  keywords: ["AI career coach", "Pakistan jobs", "CV optimization", "skill gap analysis", "mock interview"],
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
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/Favicon.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const theme = savedTheme || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 min-h-screen flex flex-col`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow shrink-0">
                <Image
                  src="/Favicon.png"
                  alt="Ustaad Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Ustaad{" "}
                <span className="font-serif font-normal text-indigo-500 dark:text-indigo-400">
                  اُستاد
                </span>
              </span>
            </Link>

            {/* Nav + controls */}
            <div className="flex items-center gap-2 sm:gap-5">
              {/* Nav links */}
              <nav className="flex items-center gap-0.5 sm:gap-1">
                <Link
                  href="/"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
                >
                  About
                </Link>
              </nav>

              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-100/30 dark:border-indigo-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                AI Powered
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          <ErrorBoundary fallbackMessage="An error occurred in the application. Please refresh the page.">
            {children}
          </ErrorBoundary>
        </div>

        <footer id="global-footer" className="py-4 border-t border-slate-200 dark:border-slate-800/60 text-center text-[10px] text-slate-400 dark:text-slate-600">
          Ustaad AI Career OS — Capstone Vibe Coding Submission by AgenticEra Systems
        </footer>
      </body>
    </html>
  );
}
