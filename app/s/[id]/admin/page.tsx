"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Bookmark, CalendarDays, CalendarPlus, Copy, Download, Lock, LockOpen, LogOut, MessageSquare,
  Settings, Share, Share2, Trash2, Users, X,
} from "lucide-react";
import {
  NavBar, Page, Section, Row, RowButton, RowSelect, Segmented, ActionSheet, Hud, useHud, Button, Switch,
  ErrorText, IconButton, TabBar, Monogram, api, ApiError, type SheetAction,
} from "@/components/ui";
import { AdminCalendar } from "@/components/AdminCalendar";
import { LEGEND, LEVEL_BG } from "@/components/levels";
import { renderShiftPng } from "@/components/png";
import { Qr } from "@/components/Qr";
import { workDays } from "@/lib/shifts";
import type { Member, PeriodInfo, PeriodSummary } from "@/lib/types";

type StoreAdmin = { authed: boolean; name: string; periods?: PeriodSummary[] };
type TabKey = "shift" | "members" | "share" | "settings";

function nextMonthOf(y: number, m: number) {
  return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
}

function Empty({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="mt-16 flex flex-col items-center gap-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-fill text-fg3">{icon}</span>
      <p className="text-[20px] font-semibold">{title}</p>
      {action}
    </div>
  );
}

function AdminInner() {
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
  const [sheet, setSheet] = useState<{ title: string; message?: string; actions: SheetAction[] } | null>(null);
  const [hud, showHud] = useHud();
  const [tab, setTab] = useState<TabKey>(isNew ? "share" : "shift");
  const [banner, setBanner] = useState(isNew);

  useEffect(() => { setOrigin(location.origin); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

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
      showHud(`${newYm.year}年${newYm.month}月を作成`);
      setTab("shift");
    } catch (e) { handle(e); }
  }

  async function setOpen(open: boolean) {
    if (!period) return;
    setErr("");
    const before = period;
    setPeriod({ ...period, open });
    try {
      await api(`/api/periods/${period.id}`, { method: "PATCH", body: JSON.stringify({ open }) });
      await loadStore(period.id);
    } catch (e) {
      setPeriod(before);
      handle(e);
    }
  }

  function askDeletePeriod() {
    if (!period) return;
    setSheet({
      title: `${period.year}年${period.month}月を削除`,
      message: "回答もすべて消えます",
      actions: [{ label: "削除", destructive: true, onSelect: () => { setSheet(null); deletePeriod(); } }],
    });
  }

  async function deletePeriod() {
    if (!period) return;
    try {
      await api(`/api/periods/${period.id}`, { method: "DELETE" });
      setPid(null);
      await loadStore();
    } catch (e) { handle(e); }
  }

  function askDeleteMember(m: Member) {
    setSheet({
      title: `${m.name} さんを削除`,
      message: "この月の回答が消えます",
      actions: [{ label: "削除", destructive: true, onSelect: () => { setSheet(null); deleteMember(m); } }],
    });
  }

  async function deleteMember(m: Member) {
    try {
      await api(`/api/members/${m.id}`, { method: "DELETE" });
      setMembers((list) => list.filter((x) => x.id !== m.id));
    } catch (e) { handle(e); }
  }

  async function shareStaffLink(url: string) {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      await nav.share({ title: "休み希望の提出", text: "このリンクから休み希望を出してください", url }).catch(() => {});
    } else {
      await copy(url);
    }
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    navigator.vibrate?.(10);
    showHud("コピーしました");
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

  function closePng() {
    if (png) URL.revokeObjectURL(png.url);
    setPng(null);
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
    return [y, y + 1, y + 2].map((v) => ({ value: v, label: `${v}年` }));
  }, []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` })), []);

  if (loadErr) return <><NavBar title="シフト調整" /><Page><Empty icon={<X size={40} strokeWidth={1.5} aria-hidden />} title={loadErr} /></Page></>;
  if (!store) return <NavBar title="" />;

  if (!store.authed) {
    return (
      <>
        <NavBar title={store.name} />
        <Page>
          <div className="mb-8 mt-10 flex flex-col items-center gap-4 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-tint text-accent"><Lock size={36} strokeWidth={1.75} aria-hidden /></span>
            <p className="text-[22px] font-bold">店長用</p>
          </div>
          <form onSubmit={login}>
            <Section>
              <label className="row relative flex min-h-[52px] items-center gap-3 px-4">
                <Lock size={22} strokeWidth={2} className="shrink-0 text-fg3" aria-hidden />
                <input className="min-w-0 flex-1 bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="パスワード" aria-label="パスワード" autoFocus />
              </label>
            </Section>
            <ErrorText>{loginErr}</ErrorText>
            <Button variant="filled" size="lg" className="w-full" disabled={!pw}>ログイン</Button>
          </form>
        </Page>
      </>
    );
  }

  const periods = store.periods ?? [];
  const staffUrl = `${origin}/s/${id}`;
  const adminUrl = `${origin}/s/${id}/admin`;

  const tabs = [
    { value: "shift" as const, label: "シフト", icon: <CalendarDays size={24} strokeWidth={2} aria-hidden /> },
    { value: "members" as const, label: "メンバー", icon: <Users size={24} strokeWidth={2} aria-hidden /> },
    { value: "share" as const, label: "共有", icon: <Share2 size={24} strokeWidth={2} aria-hidden /> },
    { value: "settings" as const, label: "設定", icon: <Settings size={24} strokeWidth={2} aria-hidden /> },
  ];

  const monthSwitcher = periods.length > 1 && (
    <div className="mb-6">
      <Segmented label="月" value={pid} onChange={setPid} items={periods.map((p) => ({ value: p.id, label: `${p.year}年${p.month}月` }))} />
    </div>
  );

  const monthTitle = period && (
    <div className="mb-4 flex items-center gap-3">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">
        {period.year}<span className="text-fg3">年</span>{period.month}<span className="text-fg3">月</span>
      </h1>
      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold ${period.open ? "bg-ok-tint text-ok" : "bg-fill text-fg3"}`}>
        {period.open ? <LockOpen size={14} strokeWidth={2.5} aria-hidden /> : <Lock size={14} strokeWidth={2.5} aria-hidden />}
        {period.open ? "受付中" : "締切"}
      </span>
    </div>
  );

  const noPeriod = (
    <Empty
      icon={<CalendarPlus size={40} strokeWidth={1.5} aria-hidden />}
      title="募集する月がありません"
      action={<Button variant="filled" size="lg" onClick={() => setTab("settings")}>月を作る</Button>}
    />
  );

  return (
    <>
      <NavBar
        title={store.name}
        right={tab === "shift" && period && members.length > 0 ? (
          <IconButton label="PNGで書き出す" onClick={makePng}><Download size={20} strokeWidth={2} aria-hidden /></IconButton>
        ) : undefined}
      />
      <Page wide={tab === "shift"}>
        {banner && (
          <div className="mb-6 flex items-center gap-3 rounded-[14px] bg-accent-tint py-2 pl-4 pr-1">
            <Bookmark size={22} strokeWidth={2} className="shrink-0 text-accent" aria-hidden />
            <p className="flex-1 text-[15px] font-semibold">このページをブックマーク</p>
            <button type="button" aria-label="閉じる" onClick={() => setBanner(false)} className="pressable flex h-11 w-11 items-center justify-center text-fg3">
              <X size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
        <ErrorText>{err}</ErrorText>

        {tab === "shift" && (
          !period ? noPeriod : (
            <>
              {monthSwitcher}
              {monthTitle}
              {members.length === 0 ? (
                <Empty
                  icon={<Users size={40} strokeWidth={1.5} aria-hidden />}
                  title="まだ回答がありません"
                  action={<Button variant="filled" size="lg" onClick={() => setTab("share")}><Share size={20} strokeWidth={2} aria-hidden />リンクを送る</Button>}
                />
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-1.5" aria-label="人数の色">
                    <Users size={16} strokeWidth={2} className="mr-1 text-fg3" aria-hidden />
                    {LEGEND.map((l) => (
                      <span key={l.level} className={`rounded-full px-2.5 py-1 text-[13px] font-semibold tabular-nums ${LEVEL_BG[l.level]} ${l.level === "n" ? "ring-1 ring-sep" : ""}`}>{l.label.replace("人", "").replace("以上", "+")}</span>
                    ))}
                  </div>
                  <AdminCalendar period={period} members={members} onToggle={toggleCut} />
                </>
              )}
            </>
          )
        )}

        {tab === "members" && (
          !period ? noPeriod : (
            <>
              {monthSwitcher}
              {monthTitle}
              {members.length === 0 ? (
                <Empty icon={<Users size={40} strokeWidth={1.5} aria-hidden />} title="まだ回答がありません" />
              ) : (
                <Section header={`${members.length}人`}>
                  {members.map((m) => {
                    const w = workDays(m, period.days);
                    return (
                      <Row key={m.id} className="py-3">
                        <Monogram name={m.name} size={44} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[17px] font-semibold">{m.name}</p>
                            <p className="shrink-0 text-[15px] tabular-nums text-fg3"><span className="font-semibold text-fg">{w}</span>/{period.days}日</p>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill" aria-hidden>
                            <div className="h-full rounded-full bg-[#34c759]" style={{ width: `${(w / period.days) * 100}%` }} />
                          </div>
                          {m.note && (
                            <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-fg3">
                              <MessageSquare size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
                              <span className="whitespace-pre-wrap">{m.note}</span>
                            </p>
                          )}
                        </div>
                        <button type="button" onClick={() => askDeleteMember(m)} aria-label={`${m.name} さんの回答を消す`} className="pressable -mr-2 flex h-11 w-11 items-center justify-center text-danger">
                          <Trash2 size={20} strokeWidth={2} aria-hidden />
                        </button>
                      </Row>
                    );
                  })}
                </Section>
              )}
            </>
          )
        )}

        {tab === "share" && (
          <div className="flex flex-col items-center">
            <div className="mt-4"><Qr value={staffUrl} size={208} /></div>
            <p className="mt-4 text-[13px] font-semibold text-fg3">バイト用</p>
            <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
              <Button variant="filled" size="lg" onClick={() => shareStaffLink(staffUrl)}><Share size={20} strokeWidth={2} aria-hidden />送る</Button>
              <Button variant="tinted" size="lg" onClick={() => copy(staffUrl)}><Copy size={20} strokeWidth={2} aria-hidden />コピー</Button>
            </div>
            <Section className="mt-10 w-full" header="店長用(人に送らない)">
              <RowButton tone="fg" onClick={() => copy(adminUrl)} aria-label="店長用のURLをコピー">
                <Lock size={20} strokeWidth={2} className="shrink-0 text-fg3" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[15px] text-fg3">{adminUrl}</span>
                <Copy size={20} strokeWidth={2} className="text-accent" aria-hidden />
              </RowButton>
            </Section>
          </div>
        )}

        {tab === "settings" && (
          <>
            {period && (
              <>
                {monthSwitcher}
                <Section header={`${period.year}年${period.month}月`}>
                  <Row>
                    <LockOpen size={22} strokeWidth={2} className="shrink-0 text-ok" aria-hidden />
                    <span className="flex-1 text-[17px]">受付中</span>
                    <Switch checked={period.open} onChange={setOpen} label="受付中" />
                  </Row>
                  <RowButton tone="danger" onClick={askDeletePeriod}>
                    <Trash2 size={22} strokeWidth={2} aria-hidden />
                    <span className="flex-1">この月を削除</span>
                  </RowButton>
                </Section>
              </>
            )}
            <Section header="新しい月">
              <RowSelect label="年" value={newYm.year} options={yearOptions} onChange={(year) => setNewYm({ ...newYm, year })} />
              <RowSelect label="月" value={newYm.month} options={monthOptions} onChange={(month) => setNewYm({ ...newYm, month })} />
              <RowButton onClick={createPeriod}>
                <CalendarPlus size={22} strokeWidth={2} aria-hidden />
                <span className="flex-1">{newYm.year}年{newYm.month}月を作成</span>
              </RowButton>
            </Section>
            <Section>
              <RowButton tone="fg" onClick={logout}>
                <LogOut size={22} strokeWidth={2} className="text-fg3" aria-hidden />
                <span className="flex-1">ログアウト</span>
              </RowButton>
            </Section>
          </>
        )}
      </Page>

      <TabBar tabs={tabs} value={tab} onChange={setTab} />
      <Hud text={hud} />
      {sheet && <ActionSheet title={sheet.title} message={sheet.message} actions={sheet.actions} onCancel={() => setSheet(null)} />}

      {png && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="書き出した画像">
          <div className="scrim-enter absolute inset-0 bg-[var(--scrim)]" onClick={closePng} />
          <div className="sheet-enter relative mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[14px] bg-bg shadow-[0_-8px_30px_rgba(0,0,0,0.2)]" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-fill" aria-hidden />
            <div className="flex items-center justify-end px-2">
              <IconButton label="閉じる" tone="fg" onClick={closePng}><X size={18} strokeWidth={2.5} aria-hidden /></IconButton>
            </div>
            <div className="flex-1 overflow-auto px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={png.url} alt="シフト表の画像" className="mx-auto w-full rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]" />
            </div>
            <div className="px-4 pt-4">
              <Button variant="filled" size="lg" className="w-full" onClick={savePng}>
                <Share size={20} strokeWidth={2} aria-hidden />
                保存・共有
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminInner />
    </Suspense>
  );
}
