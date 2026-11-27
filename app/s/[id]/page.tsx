"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, CircleCheck, CircleX, MessageSquare, Plus, UserRound } from "lucide-react";
import { NavBar, Page, Section, Segmented, Button, ErrorText, BottomBar, Monogram, api } from "@/components/ui";
import { OffPicker } from "@/components/OffPicker";
import type { Member, PeriodInfo, PeriodSummary } from "@/lib/types";

export default function StaffPage() {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<{ name: string; periods: PeriodSummary[] } | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [pid, setPid] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [off, setOff] = useState<Set<number>>(new Set());
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ name: string; periods: PeriodSummary[] }>(`/api/stores/${id}`)
      .then((s) => {
        setStore(s);
        if (s.periods[0]) setPid(s.periods[0].id);
      })
      .catch((e) => setLoadErr(e.message));
  }, [id]);

  const loadPeriod = useCallback(async (p: string) => {
    const r = await api<{ period: PeriodInfo; members: Member[] }>(`/api/periods/${p}`);
    setPeriod(r.period);
    setMembers(r.members);
    return r;
  }, []);

  useEffect(() => {
    if (!pid) return;
    startNew();
    loadPeriod(pid).catch((e) => setLoadErr(e.message));
  }, [pid, loadPeriod]);

  function startNew() {
    setEditing(null);
    setName("");
    setNote("");
    setOff(new Set());
    setErr("");
    setSaved(false);
  }

  function startEdit(m: Member) {
    setEditing(m);
    setName(m.name);
    setNote(m.note);
    setOff(new Set(m.off));
    setErr("");
    setSaved(false);
  }

  function toggle(day: number) {
    setSaved(false);
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function save() {
    if (!pid) return;
    setErr("");
    setBusy(true);
    try {
      const payload = { name, note, off: [...off] };
      if (editing) {
        await api(`/api/members/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(`/api/periods/${pid}/members`, { method: "POST", body: JSON.stringify(payload) });
      }
      const r = await loadPeriod(pid);
      const key = editing?.name ?? name.normalize("NFKC").replace(/\s+/g, " ").trim();
      const me = r.members.find((m) => m.name === key);
      if (me) {
        setEditing(me);
        setName(me.name);
      }
      setSaved(true);
      navigator.vibrate?.(12);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) {
    return (
      <>
        <NavBar title="シフト調整" />
        <Page><div className="mt-16 flex flex-col items-center gap-3 text-center text-fg3"><CircleX size={48} strokeWidth={1.5} aria-hidden /><p className="text-[17px]">{loadErr}</p></div></Page>
      </>
    );
  }
  if (!store) return <NavBar title="" />;

  const days = period?.days ?? 0;
  const canSave = !busy && (!!editing || !!name.trim());

  return (
    <>
      <NavBar title={store.name} />
      <Page>
        {store.periods.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-fill text-fg3"><CircleX size={40} strokeWidth={1.5} aria-hidden /></span>
            <p className="text-[20px] font-semibold">受付していません</p>
            <p className="text-[15px] text-fg3">店長が受付を始めると、ここに出ます</p>
          </div>
        )}

        {store.periods.length > 1 && (
          <div className="mb-6">
            <Segmented label="月" value={pid} onChange={setPid} items={store.periods.map((p) => ({ value: p.id, label: `${p.year}年${p.month}月` }))} />
          </div>
        )}

        {period && (
          <>
            <h1 className="mb-4 mt-2 text-[28px] font-bold tracking-[-0.02em]">
              {period.year}<span className="text-fg3">年</span>{period.month}<span className="text-fg3">月</span>
            </h1>

            {/* 回答した人: 連絡先アプリのように頭文字の丸を横に並べる */}
            <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4" role="list" aria-label="回答した人">
              <div className="flex gap-4">
                <button type="button" onClick={startNew} className="pressable flex w-16 shrink-0 flex-col items-center gap-1.5" aria-pressed={!editing} aria-label="新しく回答する">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${!editing ? "bg-accent-fill text-white" : "bg-fill text-accent"}`}>
                    <Plus size={26} strokeWidth={2} aria-hidden />
                  </span>
                  <span className={`text-[11px] font-semibold ${!editing ? "text-accent" : "text-fg3"}`}>新規</span>
                </button>
                {members.map((m) => {
                  const on = editing?.id === m.id;
                  return (
                    <button key={m.id} type="button" role="listitem" onClick={() => startEdit(m)} className="pressable flex w-16 shrink-0 flex-col items-center gap-1.5" aria-pressed={on} aria-label={`${m.name} の回答を直す`}>
                      <span className={`rounded-full ${on ? "ring-[3px] ring-accent ring-offset-2 ring-offset-[var(--bg)]" : ""}`}>
                        <Monogram name={m.name} size={56} active={on} />
                      </span>
                      <span className={`w-full truncate text-center text-[11px] font-semibold ${on ? "text-accent" : "text-fg2"}`}>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!editing && (
              <Section>
                <label className="row flex min-h-[52px] items-center gap-3 px-4">
                  <UserRound size={22} strokeWidth={2} className="shrink-0 text-fg3" aria-hidden />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setSaved(false); }}
                    maxLength={20}
                    placeholder="名前"
                    aria-label="名前"
                  />
                </label>
              </Section>
            )}

            <Section>
              <div className="flex items-center justify-end gap-4 px-4 pt-3 text-[13px] font-semibold" aria-hidden>
                <span className="flex items-center gap-1.5 text-ok"><span className="h-2.5 w-2.5 rounded-full bg-[#34c759]" />出勤</span>
                <span className="flex items-center gap-1.5 text-danger"><span className="h-2.5 w-2.5 rounded-full bg-danger-fill" />休み</span>
              </div>
              <div className="px-1 pb-1 pt-2">
                <OffPicker year={period.year} month={period.month} holidays={period.holidays} off={off} onToggle={toggle} />
              </div>
            </Section>

            <Section>
              <label className="flex items-start gap-3 px-4 py-3.5">
                <MessageSquare size={22} strokeWidth={2} className="mt-0.5 shrink-0 text-fg3" aria-hidden />
                <textarea
                  className="block min-h-16 w-full resize-none bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3"
                  value={note}
                  onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                  maxLength={500}
                  placeholder="備考"
                  aria-label="備考"
                />
              </label>
            </Section>

            <ErrorText>{err}</ErrorText>

            <BottomBar>
              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center gap-4 text-[17px] font-semibold tabular-nums">
                  <span className="flex items-center gap-1.5 text-ok" aria-label={`出勤 ${days - off.size}日`}>
                    <CircleCheck size={22} strokeWidth={2} aria-hidden />{days - off.size}
                  </span>
                  <span className="flex items-center gap-1.5 text-danger" aria-label={`休み ${off.size}日`}>
                    <CircleX size={22} strokeWidth={2} aria-hidden />{off.size}
                  </span>
                </div>
                <Button variant="filled" size="lg" className="min-w-[132px]" disabled={!canSave} onClick={save}>
                  {saved ? (<><Check size={20} strokeWidth={2.5} aria-hidden />保存済み</>) : busy ? "保存中" : "保存"}
                </Button>
              </div>
            </BottomBar>
          </>
        )}
      </Page>
    </>
  );
}
