import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-sales-lead-discovery-agent.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AI営業リード発掘エージェント",
  description:
    "ICP設計、候補探索、公式サイト調査、根拠付きQualification、Fit Score、優先順位、営業Draft、Human Reviewまでを再現するデモアプリです。",
  applicationName: "AI営業リード発掘エージェント",
  openGraph: {
    title: "AI営業リード発掘エージェント",
    description: "公開情報と明示的なFitルールで営業Prospecting Workflowを可視化します。",
    type: "website",
    locale: "ja_JP",
    siteName: "AI営業リード発掘エージェント",
  },
  twitter: {
    card: "summary",
    title: "AI営業リード発掘エージェント",
    description: "ICPからHuman Reviewまで、根拠を失わない営業Prospecting Workflow。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
