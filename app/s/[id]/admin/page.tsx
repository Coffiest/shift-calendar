"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, Check, Download, Lock, LockOpen, LogOut, Plus, Share, Trash2, X } from "lucide-react";
import { Page, Card, Button, Label, inputClass, ErrorText, api, ApiError } from "@/components/ui";
import { AdminCalendar } from "@/components/AdminCalendar";
import { LEGEND, LEVEL_BG } from "@/components/levels";
import { renderShiftPng } from "@/components/png";
import { workDays } from "@/lib/shifts";
import type { Member, PeriodInfo, PeriodSummary } from "@/lib/types";

type StoreAdmin = { authed: boolean; name: string; periods?: PeriodSummary[] };

function nextMonthOf(y: number, m: number) {
  return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
}

function CopyRow({ label, url }: { label: string; url: string }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input readOnly value={url} className={`${inputClass} text-[15px]`} onFocus={(e) => e.target.select()} />
        <Button
          aria-label={`${label}をコピー`}
          onClick={async () => {
            await navigator.clipboard.writeText(url).catch(() => {});
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
        >
          {done ? <Check size={18} strokeWidth={2} aria-hidden /> : <Copy size={18} strokeWidth={2} aria-hidden />}
          {done ? "済" : "コピー"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const [store, setStore] = useState<StoreAdmin | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [pid, setPid] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [err, setErr] = useState("");
  const [newYm, setNewYm] = useState({ year: 2027, month: 1 });
  const [png, setPng] = useState<{ url: string; blob: Blob } | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(location.origin), []);

  const loadStore = useCallback(async (selectId?: string) => {
    const s = await api<StoreAdmin>(`/api/stores/${id}/admin`);
    setStore(s);
    if (s.authed && s.periods) {
      const last = s.periods[s.periods.length - 1];
      if (last) setNewYm(nextMonthOf(last.year, last.month));
      else {
        const now = new Date();
        setNewYm(nextMonthOf(now.getFullYear(), now.getMonth() + 1));
      }
      const open = s.periods.filter((p) => p.open);
      const pick = selectId ?? (open[open.length - 1] ?? last)?.id ?? null;
      setPid((cur) => (selectId ? pick : cur && s.periods!.some((p) => p.id === cur) ? cur : pick));
    }
    return s;
  }, [id]);

  useEffect(() => {
    loadStore().catch((e) => setLoadErr(e.message));
  }, [loadStore]);

  const loadPeriod = useCallback(async (p: string) => {
    const r = await api<{ period: PeriodInfo; members: Member[] }>(`/api/periods/${p}/admin`);
    setPeriod(r.period);
    setMembers(r.members);
  }, []);

  useEffect(() => {
    if (!pid) { setPeriod(null); setMembers([]); return; }
    loadPeriod(pid).catch((e) => setErr(e.message));
  }, [pid, loadPeriod]);

  function handle(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      setStore((s) => (s ? { ...s, authed: false } : s));
      return;
    }
    setErr((e as Error).message);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    try {
      await api(`/api/stores/${id}/login`, { method: "POST", body: JSON.stringify({ password: pw }) });
      setPw("");
      await loadStore();
    } catch (e) {
      setLoginErr((e as Error).message);
    }
  }

  async function logout() {
    await api(`/api/stores/${id}/logout`, { method: "POST" }).catch(() => {});
    setStore((s) => (s ? { ...s, authed: false } : s));
  }

  async function createPeriod() {
    setErr("");
    try {
      const r = await api<{ id: string }>(`/api/stores/${id}/periods`, { method: "POST", body: JSON.stringify(newYm) });
      await loadStore(r.id);
    } catch (e) { handle(e); }
  }

  async function setOpen(open: boolean) {
    if (!period) return;
    setErr("");
    try {
      await api(`/api/periods/${period.id}`, { method: "PATCH", body: JSON.stringify({ open }) });
      setPeriod({ ...period, open });
      await loadStore(period.id);
    } catch (e) { handle(e); }
  }

  async function deletePeriod() {
    if (!period) return;
    if (!confirm(`${period.year}年${period.month}月を、回答ごと消す。元に戻せない。よいか`)) return;
    try {
      await api(`/api/periods/${period.id}`, { method: "DELETE" });
      setPid(null);
      await loadStore();
    } catch (e) { handle(e); }
  }

  async function deleteMember(m: Member) {
    if (!confirm(`${m.name} さんの回答を消す。元に戻せない。よいか`)) return;
    try {
      await api(`/api/members/${m.id}`, { method: "DELETE" });
      setMembers((list) => list.filter((x) => x.id !== m.id));
    } catch (e) { handle(e); }
  }

  async function toggleCut(m: Member, day: number) {
    const before = m.cuts ?? [];
    const cuts = before.includes(day) ? before.filter((d) => d !== day) : [...before, day].sort((a, b) => a - b);
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, cuts } : x)));
    try {
      await api(`/api/members/${m.id}/cuts`, { method: "PUT", body: JSON.stringify({ cuts }) });
    } catch (e) {
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, cuts: before } : x)));
      handle(e);
    }
  }

  async function makePng() {
    if (!period) return;
    setErr("");
    try {
      const blob = await renderShiftPng(period, members);
      setPng({ blob, url: URL.createObjectURL(blob) });
    } catch (e) { setErr((e as Error).message); }
  }

  async function savePng() {
    if (!png || !period) return;
    const fileName = `shift-${period.year}-${String(period.month).padStart(2, "0")}.png`;
    const file = new File([png.blob], fileName, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file] }).catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = png.url;
    a.download = fileName;
    a.click();
  }

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y + 1, y + 2];
  }, []);

  if (loadErr) return <Page><Card><p className="text-[17px]">{loadErr}</p></Card></Page>;
  if (!store) return <Page><p className="text-fg3">読み込み中</p></Page>;

  if (!store.authed) {
    return (
      <Page>
        <div className="mx-auto max-w-md">
          <p className="text-[15px] font-semibold text-fg3">{store.name}</p>
          <h1 className="mb-4 text-[28px] font-bold">店長のログイン</h1>
          <Card>
            <form onSubmit={login} className="space-y-4">
              <label className="block">
                <Label>パスワード</Label>
                <input className={inputClass} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus />
              </label>
              <ErrorText>{loginErr}</ErrorText>
              <Button variant="primary" className="w-full" disabled={!pw}>
                <Lock size={18} strokeWidth={2} aria-hidden />
                ログイン
              </Button>
            </form>
          </Card>
        </div>
      </Page>
    );
  }

  const periods = store.periods ?? [];
  const staffUrl = `${origin}/s/${id}`;
  const adminUrl = `${origin}/s/${id}/admin`;

  return (
    <Page>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold text-fg3">店長の画面</p>
          <h1 className="text-[28px] font-bold">{store.name}</h1>
        </div>
        <Button onClick={logout} aria-label="ログアウト">
          <LogOut size={18} strokeWidth={2} aria-hidden />
          ログアウト
        </Button>
      </div>

      {isNew && (
        <Card className="mb-4 border-2 border-accent">
          <p className="text-[17px] font-bold">お店を作った。この画面のURLを必ずブックマークしておくこと。</p>
          <p className="mt-1 text-[15px] text-fg2">アカウントが無いので、URLを無くすとこの画面に戻れない。</p>
        </Card>
      )}

      <Card className="mb-4 space-y-4">
        <CopyRow label="バイトに送るリンク(毎月同じ)" url={staffUrl} />
        <CopyRow label="店長用のURL(人に送らない)" url={adminUrl} />
      </Card>

      <Card className="mb-4">
        <Label>募集する月</Label>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <Button key={p.id} variant={p.id === pid ? "primary" : "plain"} onClick={() => setPid(p.id)}>
              {p.year}年{p.month}月
              <span className="text-[13px] font-semibold opacity-80">{p.open ? "受付中" : "終了"}</span>
            </Button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select className="min-h-11 rounded-xl border border-line bg-bg px-3 text-[17px] text-fg outline-none focus:border-accent" value={newYm.year} onChange={(e) => setNewYm({ ...newYm, year: Number(e.target.value) })} aria-label="年">
            {yearOptions.map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select className="min-h-11 rounded-xl border border-line bg-bg px-3 text-[17px] text-fg outline-none focus:border-accent" value={newYm.month} onChange={(e) => setNewYm({ ...newYm, month: Number(e.target.value) })} aria-label="月">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
          </select>
          <Button onClick={createPeriod}>
            <Plus size={18} strokeWidth={2} aria-hidden />
            この月の募集を作る
          </Button>
        </div>
      </Card>

      <ErrorText>{err}</ErrorText>

      {period && (
        <>
          <div className="my-4 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-[22px] font-bold">{period.year}年{period.month}月</h2>
            {period.open ? (
              <Button onClick={() => setOpen(false)}>
                <Lock size={18} strokeWidth={2} aria-hidden />
                受付を終了する
              </Button>
            ) : (
              <Button onClick={() => setOpen(true)}>
                <LockOpen size={18} strokeWidth={2} aria-hidden />
                受付を再開する
              </Button>
            )}
            <Button variant="primary" onClick={makePng}>
              <Download size={18} strokeWidth={2} aria-hidden />
              PNGで書き出す
            </Button>
          </div>

          <p className="mb-2 text-[15px] text-fg2">名前を押すとその日は「出勤なし」になる。もう一度押すと戻る。</p>
          <div className="mb-3 flex flex-wrap gap-2" aria-label="人数の色">
            {LEGEND.map((l) => (
              <span key={l.level} className={`rounded-lg border border-line px-2 py-1 text-[13px] font-semibold ${LEVEL_BG[l.level]}`}>{l.label}</span>
            ))}
          </div>

          {members.length === 0 ? (
            <Card><p className="text-[17px]">まだ誰も回答していない。上の「バイトに送るリンク」を送ろう。</p></Card>
          ) : (
            <AdminCalendar period={period} members={members} onToggle={toggleCut} />
          )}

          <Card className="mt-6">
            <h3 className="mb-3 text-[20px] font-bold">一人ずつの出勤日数</h3>
            {members.length === 0 ? (
              <p className="text-[15px] text-fg3">回答はまだない</p>
            ) : (
              <ul className="divide-y divide-line">
                {members.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-bold">{m.name}</p>
                      <p className="text-[15px] text-fg2">出勤 {workDays(m, period.days)}日 / 休み希望 {m.off.length}日</p>
                      {m.note && <p className="mt-1 whitespace-pre-wrap text-[15px] text-fg2">備考: {m.note}</p>}
                    </div>
                    <Button variant="danger" onClick={() => deleteMember(m)} aria-label={`${m.name} さんの回答を消す`}>
                      <Trash2 size={18} strokeWidth={2} aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="mt-6">
            <Button variant="danger" onClick={deletePeriod}>
              <Trash2 size={18} strokeWidth={2} aria-hidden />
              この月を消す
            </Button>
          </div>
        </>
      )}

      {png && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="書き出した画像">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-2xl bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-line p-3">
              <p className="text-[15px] font-semibold text-fg2">長押しでも保存できる</p>
              <Button aria-label="閉じる" onClick={() => { URL.revokeObjectURL(png.url); setPng(null); }}>
                <X size={18} strokeWidth={2} aria-hidden />
              </Button>
            </div>
            <div className="flex-1 overflow-auto bg-bg p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={png.url} alt="シフト表の画像" className="mx-auto w-full" />
            </div>
            <div className="border-t border-line p-3">
              <Button variant="primary" className="w-full" onClick={savePng}>
                <Share size={18} strokeWidth={2} aria-hidden />
                保存・共有する
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
