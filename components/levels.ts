import type { Level } from "@/lib/calendar";
export const LEVEL_BG: Record<Level, string> = {
  r2: "bg-r2",
  r1: "bg-r1",
  n: "bg-card",
  b1: "bg-b1",
  b2: "bg-b2",
};
export const LEGEND: { level: Level; label: string }[] = [
  { level: "r2", label: "0人" },
  { level: "r1", label: "1人" },
  { level: "n", label: "2〜4人" },
  { level: "b1", label: "5人" },
  { level: "b2", label: "6人以上" },
];
