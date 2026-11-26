"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">{children}</main>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-card p-4 ${className}`}>{children}</section>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "plain" | "danger" };
export function Button({ variant = "plain", className = "", ...rest }: BtnProps) {
  const base =
    "inline-flex min-h-11 shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition active:opacity-60 disabled:opacity-40";
  const look =
    variant === "primary"
      ? "bg-accent text-on-accent"
      : variant === "danger"
        ? "border border-line text-danger"
        : "border border-line text-fg";
  return <button {...rest} className={`${base} ${look} ${className}`} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-[13px] font-semibold text-fg3">{children}</span>;
}

export const inputClass =
  "w-full min-w-0 min-h-11 rounded-xl border border-line bg-bg px-3 text-[17px] text-fg outline-none focus:border-accent";

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-[15px] text-danger" role="alert">{children}</p>;
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(j.error ?? "通信に失敗しました。電波の良いところでもう一度試してください", res.status);
  return j as T;
}
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
