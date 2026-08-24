import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="message-page">
      <section className="message-card">
        <span className="message-icon" aria-hidden="true"><SearchX size={24} /></span>
        <p className="eyebrow">404</p>
        <h1>ページが見つかりません</h1>
        <p>AI営業リード発掘エージェントのワークスペースへ戻れます。</p>
        <Link className="button button-primary" href="/">
          <ArrowLeft size={16} /> ワークスペースへ戻る
        </Link>
      </section>
    </main>
  );
}
