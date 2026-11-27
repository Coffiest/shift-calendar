"use client";
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

/** 上に固定するバー。大きな見出しが隠れたら、題が小さくバーに収まる(iOS の Large Title と同じ) */
export function NavBar({ title, left, right }: { title: string; left?: ReactNode; right?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [titleShown, setTitleShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const big = document.getElementById("large-title");
    let io: IntersectionObserver | null = null;
    if (big) {
      io = new IntersectionObserver(([e]) => setTitleShown(!e.isIntersecting), { rootMargin: "-52px 0px 0px 0px" });
      io.observe(big);
    } else setTitleShown(true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);
  return (
    <header className="nav-bar sticky top-0 z-30" data-scrolled={scrolled} style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto grid h-11 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <span className="flex justify-start">{left}</span>
        <span className="nav-title max-w-[60vw] truncate text-[17px] font-semibold" style={{ opacity: titleShown ? 1 : 0 }} aria-hidden={!titleShown}>{title}</span>
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
      <h1 id="large-title" className="large-title">{children}</h1>
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
      {header && <h2 className="mb-1.5 px-4 text-[13px] text-fg3">{header}</h2>}
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

/** 押せる行。押した瞬間に行全体がうっすら暗くなる */
export function RowButton({
  children,
  onClick,
  tone = "accent",
  center = false,
  className = "",
  ...rest
}: { children: ReactNode; onClick: () => void; tone?: "accent" | "danger" | "fg"; center?: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const color = tone === "danger" ? "text-danger" : tone === "fg" ? "text-fg" : "text-accent";
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={`row row-press relative flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-[17px] ${center ? "justify-center" : "text-left"} ${color} ${className}`}
    >
      {children}
    </button>
  );
}

/** 行の右に値を出し、押すと端末の選択肢(ピッカー)が出る */
export function RowSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <Row className="row-press">
      <span className="flex-1 text-[17px]">{label}</span>
      <span className="flex items-center gap-1 text-[17px] text-fg3">
        {current}
        <ChevronsUpDown size={16} strokeWidth={2} aria-hidden />
      </span>
      <select
        aria-label={label}
        value={String(value)}
        onChange={(e) => {
          const hit = options.find((o) => String(o.value) === e.target.value);
          if (hit) onChange(hit.value);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    </Row>
  );
}

/** iOS のセグメント。項目が多いときは横にスクロールする */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { value: T; label: ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <div className="inline-flex min-w-full rounded-[9px] bg-fill p-[2px]" role="tablist" aria-label={label}>
        {items.map((it) => {
          const on = it.value === value;
          return (
            <button
              key={it.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(it.value)}
              className={`min-h-8 flex-1 whitespace-nowrap rounded-[7px] px-3 text-[13px] transition-[background-color,box-shadow] duration-200 ${
                on ? "bg-card font-semibold shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]" : "font-medium text-fg"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type SheetAction = { label: string; destructive?: boolean; onSelect: () => void };

/** iOS のアクションシート。取り消せない操作の確認に使う */
export function ActionSheet({
  title,
  message,
  actions,
  onCancel,
}: {
  title?: string;
  message?: string;
  actions: SheetAction[];
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title ?? "確認"}>
      <div className="scrim-enter absolute inset-0 bg-[var(--scrim)]" onClick={onCancel} />
      <div className="sheet-enter relative mx-auto w-full max-w-md px-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
        <div className="sheet-material overflow-hidden rounded-[14px]">
          {(title || message) && (
            <div className="row px-4 py-3.5 text-center">
              {title && <p className="text-[13px] font-semibold text-fg3">{title}</p>}
              {message && <p className="mt-0.5 text-[13px] text-fg3">{message}</p>}
            </div>
          )}
          {actions.map((a) => (
            <RowButton key={a.label} center tone={a.destructive ? "danger" : "accent"} onClick={a.onSelect} className="min-h-14 text-[20px]">
              {a.label}
            </RowButton>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="row-press sheet-material mt-2 min-h-14 w-full rounded-[14px] text-[20px] font-semibold text-accent"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

/** 一瞬だけ出る小さなお知らせ(コピーしました など) */
export function Hud({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center" style={{ top: "calc(env(safe-area-inset-top) + 56px)" }} role="status">
      <div className="hud-enter sheet-material flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        <Check size={18} strokeWidth={2.5} className="text-ok" aria-hidden />
        {text}
      </div>
    </div>
  );
}

export function useHud(): [string | null, (t: string) => void] {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), 1400);
    return () => clearTimeout(t);
  }, [text]);
  return [text, setText];
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
