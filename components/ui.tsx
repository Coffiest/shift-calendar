"use client";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** 上に固定する半透明のバー。中央に小さな題、右に操作 */
export function NavBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="material-bar sticky top-0 z-30 border-b border-sep" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto grid h-11 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <span />
        <span className="truncate text-[17px] font-semibold">{title}</span>
        <span className="flex justify-end">{right}</span>
      </div>
    </header>
  );
}

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto w-full px-4 pb-32 pt-4 ${wide ? "max-w-5xl" : "max-w-xl"}`}>{children}</main>
  );
}

export function LargeTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="mb-6 mt-2">
      {eyebrow && <p className="mb-1 text-[15px] font-semibold text-fg3">{eyebrow}</p>}
      <h1 className="large-title">{children}</h1>
    </div>
  );
}

/** iOS の「インセットのグループ」。見出しと補足は箱の外に置く */
export function Section({
  header,
  footer,
  children,
  className = "",
  plain = false,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  plain?: boolean;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      {header && <h2 className="mb-2 px-4 text-[13px] font-semibold text-fg3">{header}</h2>}
      <div className={plain ? "" : "overflow-hidden rounded-xl bg-card"}>{children}</div>
      {footer && <p className="mt-2 px-4 text-[13px] leading-snug text-fg3">{footer}</p>}
    </section>
  );
}

/** 箱の中の1行。行と行は左を少し空けた細い線で区切る */
export function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`row relative flex min-h-11 items-center gap-3 px-4 py-2.5 ${className}`}>
      {children}
    </div>
  );
}

export function RowInput({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Row>
      <label className="flex w-full items-center gap-3">
        <span className="w-24 shrink-0 text-[17px]">{label}</span>
        <input {...rest} className="min-w-0 flex-1 bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3" />
      </label>
    </Row>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "filled" | "tinted" | "gray" | "plain" | "destructive";
  size?: "md" | "lg";
};
export function Button({ variant = "tinted", size = "md", className = "", ...rest }: BtnProps) {
  const sizing = size === "lg" ? "min-h-[50px] px-6 text-[17px]" : "min-h-11 px-4 text-[15px]";
  const look = {
    filled: "bg-accent-fill text-white",
    tinted: "bg-accent-tint text-accent",
    gray: "bg-fill text-fg",
    plain: "text-accent",
    destructive: "bg-danger-tint text-danger",
  }[variant];
  return (
    <button
      {...rest}
      className={`pressable inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold disabled:opacity-40 disabled:active:scale-100 ${sizing} ${look} ${className}`}
    />
  );
}

/** iOS のスイッチ */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-11 w-[51px] shrink-0 items-center"
    >
      <span className={`absolute inset-x-0 h-[31px] rounded-full transition-colors duration-200 ${checked ? "bg-[#34c759]" : "bg-fill"}`} />
      <span
        className="absolute left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-300"
        style={{ transform: `translateX(${checked ? 20 : 0}px)`, transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
      />
    </button>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mb-4 px-4 text-[15px] text-danger" role="alert">{children}</p>;
}

/** 下に固定する半透明のバー(保存ボタンなど) */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="material-bar fixed inset-x-0 bottom-0 z-30 border-t border-sep" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      <div className="mx-auto max-w-xl px-4 pt-3">{children}</div>
    </div>
  );
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
