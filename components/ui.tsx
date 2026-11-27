"use client";
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { CalendarDays, Check, ChevronsUpDown } from "lucide-react";

/** アプリのアイコン(ヘッダー・トップ画面で共通) */
export function AppIcon({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center bg-gradient-to-b from-[#3d8bff] to-[#0062d6] text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
      style={{ width: size, height: size, borderRadius: size * 0.2237 }}
      aria-hidden
    >
      <CalendarDays size={size * 0.58} strokeWidth={2} />
    </span>
  );
}

/** ヘッダー。左にアプリのアイコンと題、右に操作。内容が下にくぐると半透明の素材になる */
export function NavBar({ title, right }: { title: string; right?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="nav-bar sticky top-0 z-30" data-scrolled={scrolled} style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <AppIcon size={32} />
        <span className="min-w-0 flex-1 truncate text-[20px] font-bold tracking-[-0.01em]">{title}</span>
        <span className="flex items-center gap-1">{right}</span>
      </div>
    </header>
  );
}

/** ヘッダーの右に置く丸いアイコンボタン(44x44 の押せる範囲) */
export function IconButton({ label, children, onClick, tone = "accent" }: { label: string; children: ReactNode; onClick: () => void; tone?: "accent" | "fg" }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`pressable flex h-11 w-11 items-center justify-center rounded-full ${tone === "accent" ? "text-accent" : "text-fg"}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fill">{children}</span>
    </button>
  );
}

export type Tab<T extends string> = { value: T; label: string; icon: ReactNode };

/** フッター: iPhone の下のタブ */
export function TabBar<T extends string>({ tabs, value, onChange }: { tabs: Tab<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <nav className="material-bar fixed inset-x-0 bottom-0 z-30 border-t-[0.5px] border-sep" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="画面の切り替え">
      <div className="mx-auto grid h-[56px] max-w-xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((t) => {
          const on = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => onChange(t.value)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${on ? "text-accent" : "text-fg3"}`}
            >
              {t.icon}
              <span className="text-[11px] font-medium leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** フッター(タブの無い画面用) */
export function Footer() {
  return (
    <footer className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 border-t-[0.5px] border-sep px-4 pb-8 pt-6 text-[13px] text-fg3" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 32px)" }}>
      <AppIcon size={20} />
      <span>シフト調整</span>
    </footer>
  );
}

/** 連絡先アプリと同じ、頭文字の丸 */
export function Monogram({ name, size = 40, active = false }: { name: string; size?: number; active?: boolean }) {
  const ch = Array.from(name.trim())[0] ?? "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
        active ? "bg-gradient-to-b from-[#3d8bff] to-[#0062d6]" : "bg-gradient-to-b from-[#6f737c] to-[#53565e]"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {ch}
    </span>
  );
}

export function Page({ children, wide = false, bare = false }: { children: ReactNode; wide?: boolean; bare?: boolean }) {
  return (
    <main className={`mx-auto w-full px-4 pt-4 ${bare ? "pb-0" : "pb-36"} ${wide ? "max-w-5xl" : "max-w-xl"}`}>{children}</main>
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
