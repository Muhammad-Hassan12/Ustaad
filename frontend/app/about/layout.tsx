import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Ustaad (اُستاد) — Created by Syed Muhammad Hassan",
  description:
    "Architecture, 6-agent async DAG pipeline, and creator attribution for Ustaad — an open-source AI Career OS built end-to-end by Syed Muhammad Hassan for Pakistani tech talent.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
