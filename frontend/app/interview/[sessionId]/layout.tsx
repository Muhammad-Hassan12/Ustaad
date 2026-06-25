import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interview — Ustaad Career OS",
  description: "AI-powered mock interview with real-time scoring and feedback.",
};

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
