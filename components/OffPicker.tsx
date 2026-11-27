"use client";
import { buildDays, buildWeeks, WEEK_LABELS } from "@/lib/calendar";

type Props = {
  year: number;
  month: number;
  holidays: Record<number, string>;
  off: Set<number>;
  onToggle: (day: number) => void;
  disabled?: boolean;
};

export function WeekHeader() {
  return (
    <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold">
      {WEEK_LABELS.map((w, i) => (
        <div key={w} className={i === 5 ? "text-sat" : i === 6 ? "text-sun" : "text-fg3"}>{w}</div>
      ))}
    </div>
  );
}

/** 何もしなければ全日「出勤希望」。押した日だけ「休み」になる */
export function OffPicker({ year, month, holidays, off, onToggle, disabled }: Props) {
  const weeks = buildWeeks(buildDays(year, month, holidays));
  return (
    <div>
      <WeekHeader />
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const isOff = off.has(d.day);
          const red = d.col === 6 || d.holiday;
          const tone = red ? "text-sun" : d.col === 5 ? "text-sat" : "text-fg";
          return (
            <button
              key={d.day}
              type="button"
              disabled={disabled}
              onClick={() => {
                navigator.vibrate?.(8);
                onToggle(d.day);
              }}
              aria-pressed={isOff}
              aria-label={`${month}月${d.day}日${d.holiday ? ` ${d.holiday}` : ""} ${isOff ? "休み" : "出勤希望"}`}
              className={`pressable flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-[10px] ${
                isOff ? "bg-danger-fill text-white" : "bg-ok-tint"
              }`}
            >
              <span className={`text-[19px] font-semibold leading-none tabular-nums ${isOff ? "" : tone}`}>{d.day}</span>
              <span className={`text-[11px] font-semibold leading-none ${isOff ? "" : "text-ok"}`}>
                {isOff ? "休み" : (
                  <>
                    <span className="sm:hidden">出勤</span>
                    <span className="hidden sm:inline">出勤希望</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
