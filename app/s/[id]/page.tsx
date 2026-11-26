"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Pencil, UserPlus } from "lucide-react";
import { Page, Card, Button, Label, inputClass, ErrorText, api } from "@/components/ui";
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
  const [saved, setSaved] = useState("");
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
    setSaved("");
  }

  function startEdit(m: Member) {
    setEditing(m);
    setName(m.name);
    setNote(m.note);
    setOff(new Set(m.off));
    setErr("");
    setSaved("");
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggle(day: number) {
    setSaved("");
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
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
      const me = r.members.find((m) => m.name === (editing?.name ?? name.normalize("NFKC").replace(/\s+/g, " ").trim()));
      if (me) {
        setEditing(me);
        setName(me.name);
      }
      setSaved(`保存した。休み希望 ${off.size}日`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) {
    return (
      <Page>
        <Card><p className="text-[17px]">{loadErr}</p></Card>
      </Page>
    );
  }
  if (!store) return <Page><p className="text-fg3">読み込み中</p></Page>;

  return (
    <Page>
      <div className="mx-auto max-w-md">
        <p className="text-[15px] font-semibold text-fg3">{store.name}</p>
        <h1 className="mb-4 text-[28px] font-bold">休み希望を出す</h1>

        {store.periods.length === 0 && (
          <Card><p className="text-[17px] leading-relaxed">いま受付中の月はない。店長が受付を始めたら、このページで出せるようになる。</p></Card>
        )}

        {store.periods.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {store.periods.map((p) => (
              <Button key={p.id} variant={p.id === pid ? "primary" : "plain"} onClick={() => setPid(p.id)}>
                {p.year}年{p.month}月
              </Button>
            ))}
          </div>
        )}

        {period && (
          <>
            <Card className="mb-4">
              <h2 className="mb-3 text-[20px] font-bold">{period.year}年{period.month}月</h2>
              <Label>回答した人(自分の名前を押すと直せる)</Label>
              {members.length === 0 ? (
                <p className="text-[15px] text-fg3">まだ誰も回答していない</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Button key={m.id} variant={editing?.id === m.id ? "primary" : "plain"} onClick={() => startEdit(m)}>
                      <Pencil size={16} strokeWidth={2} aria-hidden />
                      {m.name}
                    </Button>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <form id="form" onSubmit={save} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[20px] font-bold">{editing ? `${editing.name} さんの回答を直す` : "新しく回答する"}</h2>
                  {editing && (
                    <Button type="button" onClick={startNew} aria-label="新しく回答する">
                      <UserPlus size={18} strokeWidth={2} aria-hidden />
                      新規
                    </Button>
                  )}
                </div>
                {!editing && (
                  <label className="block">
                    <Label>名前</Label>
                    <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="例: 山田" />
                  </label>
                )}
                <div>
                  <Label>休みたい日を押す(押さなかった日は出勤できる扱い)</Label>
                  <OffPicker year={period.year} month={period.month} holidays={period.holidays} off={off} onToggle={toggle} />
                </div>
                <label className="block">
                  <Label>備考(任意)</Label>
                  <textarea className={`${inputClass} min-h-24 py-2`} value={note} onChange={(e) => { setNote(e.target.value); setSaved(""); }} maxLength={500} placeholder="例: 第2週はテストなので少なめ希望" />
                </label>
                <ErrorText>{err}</ErrorText>
                {saved && (
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-accent" role="status">
                    <Check size={18} strokeWidth={2} aria-hidden />
                    {saved}
                  </p>
                )}
                <Button variant="primary" className="w-full" disabled={busy || (!editing && !name.trim())}>
                  {busy ? "保存中" : "保存する"}
                </Button>
              </form>
            </Card>
          </>
        )}
      </div>
    </Page>
  );
}
