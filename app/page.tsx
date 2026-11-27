"use client";
import { useState } from "react";
import { CalendarDays, Hand, ImageDown, UserRound } from "lucide-react";
import { NavBar, Page, Section, RowInput, Button, ErrorText, api } from "@/components/ui";

const FEATURES = [
  { icon: UserRound, title: "名前を入れるだけ", body: "バイトの人はアカウント不要。リンクを開いて、休みたい日を押すだけ。" },
  { icon: Hand, title: "押して削る", body: "出勤できる全員が日ごとに並ぶ。店長は名前を押して減らしていく。" },
  { icon: ImageDown, title: "画像で配る", body: "完成したシフト表を、そのまま PNG で書き出せる。" },
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
        <div className="flex flex-col items-center pb-2 pt-6 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-gradient-to-b from-[#3d8bff] to-[#0062d6] text-white shadow-[0_8px_20px_rgba(0,98,214,0.3)]">
            <CalendarDays size={40} strokeWidth={1.75} aria-hidden />
          </div>
          <h1 id="large-title" className="large-title mt-5">シフト調整</h1>
        </div>

        <ul className="mx-auto mb-10 mt-8 max-w-sm space-y-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <Icon size={30} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="text-[15px] font-semibold">{title}</p>
                <p className="text-[15px] leading-snug text-fg3">{body}</p>
              </div>
            </li>
          ))}
        </ul>

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
