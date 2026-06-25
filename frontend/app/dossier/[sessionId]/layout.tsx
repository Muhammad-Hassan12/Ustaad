import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Dossier — Ustaad Career OS",
  description: "Your complete career analysis report with market insights and recommendations.",
};

export default function DossierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
