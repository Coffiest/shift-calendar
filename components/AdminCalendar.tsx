"use client";
import { buildDays, buildWeeks, levelFor, WEEK_LABELS, type DayInfo } from "@/lib/calendar";
import { availableOn, workersOn } from "@/lib/shifts";
import type { Member, PeriodInfo } from "@/lib/types";
import { LEVEL_BG } from "./levels";

type Props = { period: PeriodInfo; members: Member[]; onToggle: (m: Member, day: number) => void };

function DayBlock({ d, period, members, onToggle, compact }: { d: DayInfo; compact: boolean } & Props) {
  const avail = availableOn(members, d.day);
  const count = workersOn(members, d.day).length;
  const red = d.col === 6 || d.holiday;
  const tone = red ? "text-sun" : d.col === 5 ? "text-sat" : "text-fg";
  return (
    <div className={`flex h-full flex-col rounded-xl border border-line p-2 ${LEVEL_BG[levelFor(count)]}`}>
      <div className="mb-1 flex items-baseline justify-between gap-1">
        <span className={`text-[19px] font-bold ${tone}`}>
          {compact ? d.day : `${period.month}/${d.day}(${WEEK_LABELS[d.col]})`}
          {d.holiday && <span className="ml-1 text-[11px] font-semibold">{d.holiday}</span>}
        </span>
        <span className="shrink-0 text-[13px] font-bold text-fg2">{count}人</span>
      </div>
      <div className={compact ? "flex flex-col gap-1" : "flex flex-wrap gap-1"}>
        {avail.map((m) => {
          const cut = (m.cuts ?? []).includes(d.day);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m, d.day)}
              aria-pressed={!cut}
              aria-label={`${period.month}月${d.day}日 ${m.name} ${cut ? "出勤なし(押すと戻す)" : "出勤(押すと削る)"}`}
              className={`min-h-11 rounded-lg px-2 text-left text-[15px] font-semibold transition active:opacity-60 ${
                cut ? "border border-dashed border-line text-fg3 line-through" : "border border-line bg-card text-fg"
              }`}
            >
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 店長がシフトを削るカレンダー。広い画面は月の表、スマホは日ごとの縦の一覧 */
export function AdminCalendar(props: Props) {
  const days = buildDays(props.period.year, props.period.month, props.period.holidays);
  const weeks = buildWeeks(days);
  return (
    <>
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1 text-center text-[13px] font-semibold">
          {WEEK_LABELS.map((w, i) => (
            <div key={w} className={i === 5 ? "text-sat" : i === 6 ? "text-sun" : "text-fg3"}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {weeks.flat().map((d, i) => (d ? <DayBlock key={d.day} d={d} compact {...props} /> : <div key={`e${i}`} />))}
        </div>
      </div>
      <div className="space-y-2 md:hidden">
        {days.map((d) => (
          <DayBlock key={d.day} d={d} compact={false} {...props} />
        ))}
      </div>
    </>
  );
}
