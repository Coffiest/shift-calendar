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

/** バイトが休みたい日を押して選ぶ、月のカレンダー */
export function OffPicker({ year, month, holidays, off, onToggle, disabled }: Props) {
  const weeks = buildWeeks(buildDays(year, month, holidays));
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[13px] font-semibold">
        {WEEK_LABELS.map((w, i) => (
          <div key={w} className={i === 5 ? "text-sat" : i === 6 ? "text-sun" : "text-fg3"}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
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
              onClick={() => onToggle(d.day)}
              aria-pressed={isOff}
              aria-label={`${month}月${d.day}日${d.holiday ? ` ${d.holiday}` : ""} ${isOff ? "休み希望" : "出勤できる"}`}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-[17px] font-semibold transition active:opacity-60 ${
                isOff ? "border-transparent bg-off text-off-fg" : `border-line ${tone}`
              }`}
            >
              <span>{d.day}</span>
              <span className="text-[11px] font-bold leading-none">{isOff ? "休み" : d.holiday ? "祝" : " "}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
