"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Page, Card, Button, Label, inputClass, ErrorText, api } from "@/components/ui";

export default function Home() {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>("/api/stores", {
        method: "POST",
        body: JSON.stringify({ name, password: pw }),
      });
      location.href = `/s/${id}/admin?new=1`;
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <CalendarDays size={28} strokeWidth={2} className="text-accent" aria-hidden />
          <h1 className="text-[28px] font-bold">シフト調整</h1>
        </div>
        <p className="mb-6 text-[17px] leading-relaxed text-fg2">
          バイトの人はリンクを開いて名前を入れ、休みたい日を選ぶだけ。店長は集まった名前から削っていき、完成したらPNGで書き出せる。
        </p>
        <Card>
          <h2 className="mb-4 text-[20px] font-bold">お店を作る(店長用)</h2>
          <form onSubmit={create} className="space-y-4">
            <label className="block">
              <Label>店名</Label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="例: カフェ〇〇 駅前店" />
            </label>
            <label className="block">
              <Label>店長のパスワード(4文字以上)</Label>
              <input className={inputClass} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
            </label>
            <ErrorText>{err}</ErrorText>
            <Button variant="primary" className="w-full" disabled={busy || !name.trim() || pw.length < 4}>
              {busy ? "作成中" : "作成する"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-[13px] leading-relaxed text-fg3">
          アカウントは作らない。作成後に出る「店長用のURL」をブックマークしておくこと。URLを無くすとお店に戻れない。
        </p>
      </div>
    </Page>
  );
}
