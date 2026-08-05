import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-ink border-b border-warm-gray/15 px-4 sm:px-8 md:px-12 py-3.5 flex items-center justify-between">
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
      <div className="flex items-center gap-3.5 sm:gap-6 font-body text-xs sm:text-sm text-warm-gray shrink-0">
        <Link href="/" className="hover:text-brass transition-colors font-medium">
          Home
        </Link>
        <Link href="/about" className="hover:text-brass transition-colors font-medium">
          About
        </Link>
        <a
          href="https://github.com/Muhammad-Hassan12/Ustaad"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brass transition-colors font-medium border border-brass/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-sm text-[11px] sm:text-xs text-brass hover:bg-brass/10 whitespace-nowrap"
        >
          GitHub →
        </a>
      </div>
    </nav>
  );
}
