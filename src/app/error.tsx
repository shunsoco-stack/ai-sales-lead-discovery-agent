"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="message-page">
      <section className="message-card" role="alert">
        <span className="message-icon" aria-hidden="true"><AlertTriangle size={24} /></span>
        <p className="eyebrow">RECOVERY</p>
        <h1>表示を続けられませんでした</h1>
        <p>入力内容は外部へ送信されていません。画面を再構築して、もう一度お試しください。</p>
        <button className="button button-primary" type="button" onClick={() => reset()}>
          <RotateCcw size={16} /> 再試行
        </button>
      </section>
    </main>
  );
}
