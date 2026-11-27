"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { NavBar, Page, LargeTitle, Section, RowInput, Button, ErrorText, api } from "@/components/ui";

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
    <>
      <NavBar title="シフト調整" />
      <Page>
        <div className="mb-4 mt-4 flex h-14 w-14 items-center justify-center rounded-[14px] bg-accent-fill text-white">
          <CalendarDays size={30} strokeWidth={2} aria-hidden />
        </div>
        <LargeTitle>シフト調整</LargeTitle>
        <p className="-mt-3 mb-8 text-[17px] leading-relaxed text-fg2">
          バイトの人はリンクを開いて名前を入れ、休みたい日を押すだけ。店長は集まった名前から削っていき、完成したらPNGで書き出せる。
        </p>
        <form onSubmit={create}>
          <Section header="お店を作る(店長用)" footer="アカウントは作らない。作成後に出る「店長用のURL」をブックマークしておくこと。URLを無くすとお店に戻れない。">
            <RowInput label="店名" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="カフェ〇〇 駅前店" />
            <RowInput label="パスワード" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="4文字以上" />
          </Section>
          <ErrorText>{err}</ErrorText>
          <Button variant="filled" size="lg" className="w-full" disabled={busy || !name.trim() || pw.length < 4}>
            {busy ? "作成中" : "作成する"}
          </Button>
        </form>
      </Page>
    </>
  );
}
