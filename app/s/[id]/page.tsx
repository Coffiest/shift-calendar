"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { NavBar, Page, LargeTitle, Section, Row, RowInput, Button, ErrorText, BottomBar, api } from "@/components/ui";
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
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <Page><Section><Row><p className="text-[17px]">{loadErr}</p></Row></Section></Page>
      </>
    );
  }
  if (!store) return <><NavBar title="" /><Page><p className="px-4 text-fg3">読み込み中</p></Page></>;

  const days = period?.days ?? 0;
  const canSave = !busy && (!!editing || !!name.trim());

  return (
    <>
      <NavBar title={store.name} />
      <Page>
        <LargeTitle eyebrow={store.name}>休み希望</LargeTitle>

        {store.periods.length === 0 && (
          <Section footer="店長が受付を始めたら、このページで出せるようになる。">
            <Row><p className="text-[17px]">いま受付中の月はない</p></Row>
          </Section>
        )}

        {store.periods.length > 1 && (
          <div className="mb-6 flex rounded-[9px] bg-fill p-0.5" role="tablist" aria-label="月">
            {store.periods.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === pid}
                onClick={() => setPid(p.id)}
                className={`pressable min-h-9 flex-1 rounded-[7px] text-[13px] font-semibold ${p.id === pid ? "bg-card shadow-[0_3px_8px_rgba(0,0,0,0.12)]" : "text-fg2"}`}
              >
                {p.year}年{p.month}月
              </button>
            ))}
          </div>
        )}

        {period && (
          <>
            <Section header={`${period.year}年${period.month}月に回答した人`} footer="自分の名前を押すと、出した内容を直せる。" plain>
              {members.length === 0 ? (
                <div className="rounded-xl bg-card px-4 py-3 text-[15px] text-fg3">まだ誰も回答していない</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Button key={m.id} variant={editing?.id === m.id ? "filled" : "gray"} onClick={() => startEdit(m)}>
                      {m.name}
                    </Button>
                  ))}
                </div>
              )}
            </Section>

            <div id="form" className="scroll-mt-14" />
            {editing ? (
              <Section header="名前">
                <Row>
                  <span className="flex-1 text-[17px] font-semibold">{editing.name}</span>
                  <Button variant="plain" className="-mr-3" onClick={startNew}>
                    <UserPlus size={18} strokeWidth={2} aria-hidden />
                    別の人として回答
                  </Button>
                </Row>
              </Section>
            ) : (
              <Section header="名前">
                <RowInput label="名前" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={20} placeholder="例: 山田" />
              </Section>
            )}

            <Section header="日ごとの希望" footer="最初は全部の日が「出勤希望」。休みたい日を押すと「休み」になる。もう一度押すと戻る。">
              <div className="p-2">
                <OffPicker year={period.year} month={period.month} holidays={period.holidays} off={off} onToggle={toggle} />
              </div>
            </Section>

            <Section header="備考(任意)">
              <textarea
                className="block min-h-24 w-full resize-none bg-transparent px-4 py-3 text-[17px] text-fg outline-none placeholder:text-fg3"
                value={note}
                onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                maxLength={500}
                placeholder="例: 第2週はテストなので少なめ希望"
                aria-label="備考"
              />
            </Section>

            <ErrorText>{err}</ErrorText>

            <BottomBar>
              <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
                <span className="text-fg3">
                  出勤希望 <span className="text-ok">{days - off.size}日</span> ・ 休み <span className="text-danger">{off.size}日</span>
                </span>
                {saved && (
                  <span className="flex items-center gap-1 text-ok" role="status">
                    <Check size={16} strokeWidth={2.5} aria-hidden />
                    保存した
                  </span>
                )}
              </div>
              <Button variant="filled" size="lg" className="w-full" disabled={!canSave} onClick={save}>
                {busy ? "保存中" : editing ? "変更を保存" : "保存する"}
              </Button>
            </BottomBar>
          </>
        )}
      </Page>
    </>
  );
}
