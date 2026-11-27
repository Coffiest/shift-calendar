"use client";
import { buildDays, buildWeeks, levelFor, WEEK_LABELS, type DayInfo } from "@/lib/calendar";
import { availableOn, workersOn } from "@/lib/shifts";
import type { Member, PeriodInfo } from "@/lib/types";
import { LEVEL_BG } from "./levels";
import { WeekHeader } from "./OffPicker";

type Props = { period: PeriodInfo; members: Member[]; onToggle: (m: Member, day: number) => void };

function DayBlock({ d, period, members, onToggle, compact }: { d: DayInfo; compact: boolean } & Props) {
  const avail = availableOn(members, d.day);
  const count = workersOn(members, d.day).length;
  const red = d.col === 6 || d.holiday;
  const tone = red ? "text-sun" : d.col === 5 ? "text-sat" : "text-fg";
  return (
    <div className={`flex h-full flex-col rounded-xl p-2 ${LEVEL_BG[levelFor(count)]}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-1 px-1">
        <span className={`text-[19px] font-bold tabular-nums ${tone}`}>
          {compact ? d.day : `${period.month}/${d.day}`}
          {!compact && <span className="ml-1 text-[15px] font-semibold">({WEEK_LABELS[d.col]})</span>}
          {d.holiday && <span className="ml-1 text-[11px] font-semibold">{d.holiday}</span>}
        </span>
        <span className="shrink-0 text-[13px] font-bold tabular-nums text-fg2">{count}人</span>
      </div>
      <div className={compact ? "flex flex-col gap-1" : "flex flex-wrap gap-1.5"}>
        {avail.map((m) => {
          const cut = (m.cuts ?? []).includes(d.day);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                navigator.vibrate?.(8);
                onToggle(m, d.day);
              }}
              aria-pressed={!cut}
              aria-label={`${period.month}月${d.day}日 ${m.name} ${cut ? "出勤なし(押すと戻す)" : "出勤(押すと削る)"}`}
              className={`pressable min-h-11 truncate rounded-full px-3 text-[15px] font-semibold ${compact ? "text-left" : ""} ${
                cut ? "bg-transparent text-fg3 line-through outline outline-1 -outline-offset-1 outline-sep" : "bg-card text-fg shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
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
        <WeekHeader />
        <div className="grid grid-cols-7 gap-1">
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
