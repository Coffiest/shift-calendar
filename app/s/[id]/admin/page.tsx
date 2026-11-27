"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, Check, Download, Plus, Share, Trash2 } from "lucide-react";
import { NavBar, Page, LargeTitle, Section, Row, RowInput, Button, Switch, ErrorText, api, ApiError } from "@/components/ui";
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
    <Row>
      <div className="min-w-0 flex-1">
        <p className="text-[17px]">{label}</p>
        <p className="truncate text-[13px] text-fg3">{url}</p>
      </div>
      <Button
        variant="tinted"
        aria-label={`${label}をコピー`}
        onClick={async () => {
          await navigator.clipboard.writeText(url).catch(() => {});
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? <Check size={18} strokeWidth={2} aria-hidden /> : <Copy size={18} strokeWidth={2} aria-hidden />}
        {done ? "コピーした" : "コピー"}
      </Button>
    </Row>
  );
}

const selectClass = "pressable min-h-11 rounded-full bg-fill px-4 text-[15px] font-semibold text-fg outline-none";

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
    return [y, y + 1, y + 2];
  }, []);

  if (loadErr) return <><NavBar title="店長" /><Page><Section><Row><p className="text-[17px]">{loadErr}</p></Row></Section></Page></>;
  if (!store) return <><NavBar title="" /><Page><p className="px-4 text-fg3">読み込み中</p></Page></>;

  if (!store.authed) {
    return (
      <>
        <NavBar title={store.name} />
        <Page>
          <LargeTitle eyebrow={store.name}>店長のログイン</LargeTitle>
          <form onSubmit={login}>
            <Section>
              <RowInput label="パスワード" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus />
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

  return (
    <>
      <NavBar title={store.name} right={<Button variant="plain" className="-mr-3" onClick={logout}>ログアウト</Button>} />
      <Page wide>
        <LargeTitle eyebrow="店長の画面">{store.name}</LargeTitle>

        {isNew && (
          <Section footer="アカウントが無いので、URLを無くすとこの画面に戻れない。">
            <Row className="bg-accent-tint">
              <p className="py-1 text-[17px] font-semibold">お店を作った。この画面のURLを必ずブックマークしておくこと。</p>
            </Row>
          </Section>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-6">
          <Section header="共有">
            <CopyRow label="バイトに送るリンク" url={staffUrl} />
            <CopyRow label="店長用のURL" url={adminUrl} />
          </Section>

          <Section header="募集する月" footer="バイトに送るリンクは毎月同じ。受付中の月だけがバイトの画面に出る。">
            {periods.length > 0 && (
              <Row className="flex-wrap">
                {periods.map((p) => (
                  <Button key={p.id} variant={p.id === pid ? "filled" : "gray"} onClick={() => setPid(p.id)}>
                    {p.year}年{p.month}月
                    <span className="text-[13px] opacity-80">{p.open ? "受付中" : "終了"}</span>
                  </Button>
                ))}
              </Row>
            )}
            <Row className="flex-wrap">
              <select className={selectClass} value={newYm.year} onChange={(e) => setNewYm({ ...newYm, year: Number(e.target.value) })} aria-label="年">
                {yearOptions.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select className={selectClass} value={newYm.month} onChange={(e) => setNewYm({ ...newYm, month: Number(e.target.value) })} aria-label="月">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
              <Button variant="tinted" onClick={createPeriod}>
                <Plus size={18} strokeWidth={2} aria-hidden />
                募集を作る
              </Button>
            </Row>
          </Section>
        </div>

        <ErrorText>{err}</ErrorText>

        {period && (
          <>
            <Section header={`${period.year}年${period.month}月`}>
              <Row>
                <div className="flex-1">
                  <p className="text-[17px]">受付中</p>
                  <p className="text-[13px] text-fg3">{period.open ? "バイトが休み希望を出せる" : "締め切り中。バイトは直せない"}</p>
                </div>
                <Switch checked={period.open} onChange={setOpen} label="受付中" />
              </Row>
              <Row>
                <button type="button" onClick={makePng} className="pressable flex min-h-11 flex-1 items-center gap-2 text-left text-[17px] text-accent">
                  <Download size={20} strokeWidth={2} aria-hidden />
                  PNGで書き出す
                </button>
              </Row>
            </Section>

            <Section
              header="シフト"
              footer="名前を押すと、その日は「出勤なし」になる。もう一度押すと戻る。"
              plain
            >
              <div className="mb-3 flex flex-wrap gap-1.5" aria-label="人数の色">
                {LEGEND.map((l) => (
                  <span key={l.level} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${LEVEL_BG[l.level]}`}>{l.label}</span>
                ))}
              </div>
              {members.length === 0 ? (
                <div className="rounded-xl bg-card px-4 py-3 text-[17px]">まだ誰も回答していない。「バイトに送るリンク」を送ろう。</div>
              ) : (
                <AdminCalendar period={period} members={members} onToggle={toggleCut} />
              )}
            </Section>

            <Section header="一人ずつの出勤日数">
              {members.length === 0 ? (
                <Row><p className="text-[15px] text-fg3">回答はまだない</p></Row>
              ) : (
                members.map((m) => (
                  <Row key={m.id}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-semibold">{m.name}</p>
                      <p className="text-[15px] tabular-nums text-fg3">出勤 {workDays(m, period.days)}日 ・ 休み希望 {m.off.length}日</p>
                      {m.note && <p className="mt-0.5 whitespace-pre-wrap text-[15px] text-fg2">{m.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMember(m)}
                      aria-label={`${m.name} さんの回答を消す`}
                      className="pressable -mr-2 flex h-11 w-11 items-center justify-center text-danger"
                    >
                      <Trash2 size={20} strokeWidth={2} aria-hidden />
                    </button>
                  </Row>
                ))
              )}
            </Section>

            <Section>
              <Row>
                <button type="button" onClick={deletePeriod} className="pressable flex min-h-11 flex-1 items-center justify-center text-[17px] text-danger">
                  この月を消す
                </button>
              </Row>
            </Section>
          </>
        )}
      </Page>

      {png && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="書き出した画像">
          <div className="scrim-enter absolute inset-0 bg-[var(--scrim)]" onClick={closePng} />
          <div
            className="sheet-enter relative mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[16px] bg-bg"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
          >
            <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-fill" aria-hidden />
            <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2">
              <span />
              <span className="text-[17px] font-semibold">シフト表</span>
              <span className="flex justify-end">
                <Button variant="plain" className="-mr-3" onClick={closePng}>完了</Button>
              </span>
            </div>
            <div className="flex-1 overflow-auto px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={png.url} alt="シフト表の画像" className="mx-auto w-full rounded-xl" />
              <p className="mt-2 text-center text-[13px] text-fg3">画像を長押ししても保存できる</p>
            </div>
            <div className="px-4 pt-3">
              <Button variant="filled" size="lg" className="w-full" onClick={savePng}>
                <Share size={18} strokeWidth={2} aria-hidden />
                保存・共有する
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
