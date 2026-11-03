export default function Footer() {
  return (
    <footer className="print:hidden px-6 md:px-12 py-6 bg-ink border-t border-warm-gray/15 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-warm-gray font-body">
      <span>Ustaad (اُستاد) © 2026 AgenticEra Systems</span>
      <span className="font-mono text-[11px] text-warm-gray/70">
        Built for Graduates · Made in Karachi 🇵🇰
      </span>
    </footer>
  );
}
