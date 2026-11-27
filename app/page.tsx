"use client";
import { useState } from "react";
import { Hand, ImageDown, Lock, Store, UserRound } from "lucide-react";
import { NavBar, Page, Section, Button, ErrorText, AppIcon, Footer, api } from "@/components/ui";

const STEPS = [
  { icon: UserRound, label: "名前と休み" },
  { icon: Hand, label: "押して削る" },
  { icon: ImageDown, label: "画像で配る" },
];

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
      const { id } = await api<{ id: string }>("/api/stores", { method: "POST", body: JSON.stringify({ name, password: pw }) });
      location.href = `/s/${id}/admin?new=1`;
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <NavBar title="シフト調整" />
      <Page bare>
        <div className="flex flex-col items-center pt-8 text-center">
          <span className="drop-shadow-[0_12px_24px_rgba(0,98,214,0.28)]"><AppIcon size={96} /></span>
          <h1 className="mt-6 text-[34px] font-bold leading-tight tracking-[-0.02em]">シフト調整</h1>
          <p className="mt-2 text-[17px] text-fg3">集めて、削って、配る。</p>
        </div>

        <ol className="mx-auto my-10 grid max-w-sm grid-cols-3 gap-2">
          {STEPS.map(({ icon: Icon, label }, i) => (
            <li key={label} className="flex flex-col items-center gap-2 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-[18px] bg-card text-accent shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <Icon size={30} strokeWidth={1.75} aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-fill text-[11px] font-bold text-white">{i + 1}</span>
              </span>
              <span className="text-[13px] font-semibold text-fg2">{label}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={create}>
          <Section>
            <label className="row relative flex min-h-[52px] items-center gap-3 px-4">
              <Store size={22} strokeWidth={2} className="shrink-0 text-fg3" aria-hidden />
              <input className="min-w-0 flex-1 bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="店名" aria-label="店名" />
            </label>
            <label className="row relative flex min-h-[52px] items-center gap-3 px-4">
              <Lock size={22} strokeWidth={2} className="shrink-0 text-fg3" aria-hidden />
              <input className="min-w-0 flex-1 bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="パスワード(4文字以上)" aria-label="パスワード" />
            </label>
          </Section>
          <ErrorText>{err}</ErrorText>
          <Button variant="filled" size="lg" className="w-full" disabled={busy || !name.trim() || pw.length < 4}>
            {busy ? "作成中" : "お店を作る"}
          </Button>
          <p className="mt-3 text-center text-[13px] text-fg3">作成後の画面を必ずブックマーク</p>
        </form>
      </Page>
      <Footer />
    </>
  );
}
