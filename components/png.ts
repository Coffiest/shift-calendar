"use client";
import { buildDays, buildWeeks, WEEK_LABELS } from "@/lib/calendar";
import { workersOn } from "@/lib/shifts";
import type { Member, PeriodInfo } from "@/lib/types";

const FONT = `-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
const PAD = 40;
const COL_W = 190;
const HEAD_H = 44;
const DATE_H = 44;
const LINE_H = 30;

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}

/** 確定したシフトを白地のカレンダー画像にする(色分けはしない) */
export async function renderShiftPng(period: PeriodInfo, members: Member[]): Promise<Blob> {
  const weeks = buildWeeks(buildDays(period.year, period.month, period.holidays));
  const rowHeights = weeks.map((w) => {
    const most = Math.max(1, ...w.map((d) => (d ? workersOn(members, d.day).length : 0)));
    return Math.max(110, DATE_H + most * LINE_H + 16);
  });
  const titleH = 100;
  const width = PAD * 2 + COL_W * 7;
  const height = PAD + titleH + HEAD_H + rowHeights.reduce((a, b) => a + b, 0) + PAD;
  const scale = 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("この端末では画像を作れない");
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#1c1c1e";
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(fit(ctx, `${period.storeName}  ${period.year}年${period.month}月 シフト表`, width - PAD * 2), PAD, PAD + 40);

  const top = PAD + titleH;
  ctx.fillStyle = "#f2f2f7";
  ctx.fillRect(PAD, top, COL_W * 7, HEAD_H);
  ctx.font = `700 20px ${FONT}`;
  ctx.textAlign = "center";
  WEEK_LABELS.forEach((w, i) => {
    ctx.fillStyle = i === 5 ? "#0a5cc2" : i === 6 ? "#c4251c" : "#3c3c43";
    ctx.fillText(w, PAD + COL_W * i + COL_W / 2, top + HEAD_H / 2);
  });
  ctx.textAlign = "left";

  let y = top + HEAD_H;
  weeks.forEach((week, wi) => {
    const h = rowHeights[wi];
    week.forEach((d, ci) => {
      const x = PAD + COL_W * ci;
      if (!d) {
        ctx.fillStyle = "#f7f7f9";
        ctx.fillRect(x, y, COL_W, h);
        return;
      }
      const red = d.col === 6 || d.holiday;
      ctx.fillStyle = red ? "#c4251c" : d.col === 5 ? "#0a5cc2" : "#1c1c1e";
      ctx.font = `700 22px ${FONT}`;
      ctx.fillText(String(d.day), x + 12, y + DATE_H / 2 + 2);
      if (d.holiday) {
        const numW = ctx.measureText(String(d.day)).width;
        ctx.font = `500 14px ${FONT}`;
        ctx.fillText(fit(ctx, d.holiday, COL_W - numW - 32), x + 12 + numW + 8, y + DATE_H / 2 + 3);
      }
      ctx.fillStyle = "#1c1c1e";
      ctx.font = `500 20px ${FONT}`;
      workersOn(members, d.day).forEach((m, i) => {
        ctx.fillText(fit(ctx, m.name, COL_W - 24), x + 12, y + DATE_H + LINE_H * i + LINE_H / 2);
      });
    });
    y += h;
  });

  // 罫線
  ctx.strokeStyle = "#c7c7cc";
  ctx.lineWidth = 1;
  const gridBottom = y;
  for (let i = 0; i <= 7; i++) {
    const x = PAD + COL_W * i + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, gridBottom);
    ctx.stroke();
  }
  let ly = top;
  [HEAD_H, ...rowHeights].forEach((h, i) => {
    if (i === 0) {
      ctx.beginPath();
      ctx.moveTo(PAD, ly + 0.5);
      ctx.lineTo(PAD + COL_W * 7, ly + 0.5);
      ctx.stroke();
    }
    ly += h;
    ctx.beginPath();
    ctx.moveTo(PAD, ly + 0.5);
    ctx.lineTo(PAD + COL_W * 7, ly + 0.5);
    ctx.stroke();
  });

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を作れなかった"))), "image/png"),
  );
}
