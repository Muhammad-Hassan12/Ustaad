"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ApiKeyModal from "@/components/ApiKeyModal";
import ResumeSessionModal from "@/components/ResumeSessionModal";
import { useActiveBYOKConfig } from "@/lib/llmConfig";
import { Key, History, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const activeByok = useActiveBYOKConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const shortModel = activeByok
    ? activeByok.model.split("/").pop()?.slice(0, 18) || activeByok.model
    : null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-ink border-b border-warm-gray/15 px-4 sm:px-8 md:px-12 py-3.5 flex items-center justify-between print:hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group whitespace-nowrap">
          <div className="w-8 h-8 rounded-sm overflow-hidden border border-brass/30 shrink-0">
            <Image
              src="/Favicon.png"
              alt="Ustaad Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-display text-xl sm:text-2xl text-parchment tracking-wide inline-flex items-baseline gap-1.5 whitespace-nowrap">
            <span>اُستاد</span>
            <span className="font-body text-[10px] sm:text-xs text-brass tracking-wider uppercase font-semibold">
              USTAAD
            </span>
          </span>
        </Link>

        {/* Desktop Nav Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 font-body text-xs sm:text-sm text-warm-gray shrink-0">
          <Link href="/" className="hover:text-brass transition-colors font-medium">
            Home
          </Link>
          <Link href="/about" className="hover:text-brass transition-colors font-medium">
            About
          </Link>

          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-brass/30 text-brass hover:bg-brass/10 font-mono text-[11px] sm:text-xs transition-colors cursor-pointer whitespace-nowrap"
            title="Resume a previous analysis session"
          >
            <History size={13} className="text-brass" />
            <span>Resume Session</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-mono text-[11px] sm:text-xs transition-colors cursor-pointer whitespace-nowrap ${
              activeByok
                ? "border-teal/50 text-teal bg-teal/10 hover:bg-teal/20"
                : "border-warm-gray/30 text-warm-gray hover:text-parchment hover:border-brass/40"
            }`}
            title="Configure AI Provider & BYOK Model"
          >
            <Key size={13} className={activeByok ? "text-teal" : "text-brass"} />
            <span>
              {activeByok
                ? `${activeByok.providerShortName} · ${shortModel}`
                : "AI Model / Key"}
            </span>
          </button>

          <a
            href="https://github.com/Muhammad-Hassan12/Ustaad"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brass transition-colors font-medium border border-brass/30 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-sm text-[11px] sm:text-xs text-brass hover:bg-brass/10 whitespace-nowrap"
          >
            GitHub →
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-sm border border-warm-gray/30 text-warm-gray hover:text-brass hover:border-brass/40 transition-colors cursor-pointer"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden sticky top-[57px] z-40 w-full bg-ink border-b border-warm-gray/15 px-5 py-4 flex flex-col gap-1 animate-fadeInUp shadow-lg print:hidden"
        >
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="font-body text-sm text-warm-gray hover:text-brass transition-colors font-medium py-2.5 border-b border-warm-gray/10"
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={closeMobileMenu}
            className="font-body text-sm text-warm-gray hover:text-brass transition-colors font-medium py-2.5 border-b border-warm-gray/10"
          >
            About
          </Link>

          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              setIsResumeModalOpen(true);
            }}
            className="flex items-center gap-2 text-left font-mono text-xs text-brass hover:text-brass/80 py-2.5 border-b border-warm-gray/10 transition-colors cursor-pointer"
          >
            <History size={14} />
            Resume Past Session
          </button>

          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              setIsModalOpen(true);
            }}
            className={`flex items-center gap-2 text-left font-mono text-xs py-2.5 border-b border-warm-gray/10 transition-colors cursor-pointer ${
              activeByok ? "text-teal" : "text-warm-gray hover:text-parchment"
            }`}
          >
            <Key size={14} className={activeByok ? "text-teal" : "text-brass"} />
            {activeByok
              ? `BYOK: ${activeByok.providerShortName} (${shortModel}) ✓`
              : "Configure AI Provider / BYOK"}
          </button>

          <a
            href="https://github.com/Muhammad-Hassan12/Ustaad"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobileMenu}
            className="font-body text-sm text-brass hover:text-brass/80 transition-colors font-medium py-2.5"
          >
            GitHub →
          </a>
        </div>
      )}

      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ResumeSessionModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </>
  );
}
