import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Ustaad Career OS",
  description: "Real-time pipeline progress and career analysis results.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
