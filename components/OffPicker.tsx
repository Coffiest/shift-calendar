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
    <div className="grid grid-cols-7 pb-1.5 text-center text-[11px] font-semibold">
      {WEEK_LABELS.map((w, i) => (
        <div key={w} className={i === 5 ? "text-sat" : i === 6 ? "text-sun" : "text-fg3"}>{w}</div>
      ))}
    </div>
  );
}

/**
 * iPhone の「カレンダー」と同じ形の月表示。
 * 何もしなければ全日「出勤希望」。押した日は日付が赤い丸で囲まれ「休み」になる。
 */
export function OffPicker({ year, month, holidays, off, onToggle, disabled }: Props) {
  const weeks = buildWeeks(buildDays(year, month, holidays));
  return (
    <div>
      <WeekHeader />
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-t-[0.5px] border-sep">
          {week.map((d, i) => {
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
                className="group flex min-h-[64px] flex-col items-center justify-start gap-1 pt-1.5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[20px] tabular-nums transition-[background-color,transform] duration-200 group-active:scale-90 group-active:duration-0 ${
                    isOff ? "bg-danger-fill font-semibold text-white" : `font-normal ${tone} group-active:bg-[var(--highlight)]`
                  }`}
                >
                  {d.day}
                </span>
                <span className={`text-[11px] font-semibold leading-none ${isOff ? "text-danger" : "text-ok"}`}>
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
      ))}
    </div>
  );
}
