import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI営業リード発掘エージェント",
    short_name: "AI営業リード発掘",
    description: "根拠付きQualificationとHuman Reviewを備えた営業Prospectingデモ。",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    lang: "ja",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
