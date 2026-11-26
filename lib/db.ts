import { neon } from "@neondatabase/serverless";

export type Row = Record<string, unknown>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

let runner: Runner | null = null;
let schemaReady: Promise<void> | null = null;

async function getRunner(): Promise<Runner> {
  if (runner) return runner;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL が設定されていない");
  if (/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    // 手元で動かすときだけ、普通の Postgres に繋ぐ
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    runner = async (text, params) => (await pool.query(text, params)).rows as Row[];
  } else {
    const sql = neon(url);
    runner = async (text, params) => (await sql.query(text, params)) as Row[];
  }
  return runner;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stores (
    id text PRIMARY KEY,
    name text NOT NULL,
    pw_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS periods (
    id text PRIMARY KEY,
    store_id text NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    year int NOT NULL,
    month int NOT NULL,
    open boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (store_id, year, month)
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id text PRIMARY KEY,
    period_id text NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    name text NOT NULL,
    note text NOT NULL DEFAULT '',
    off_days int[] NOT NULL DEFAULT '{}',
    cut_days int[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (period_id, name)
  )`,
];

/** タグ付きテンプレートで SQL を書く。値は必ずパラメータとして渡す。最初の1回だけ表を作る */
export async function q(strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]> {
  const run = await getRunner();
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const s of SCHEMA) await run(s, []);
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
  let text = strings[0];
  for (let i = 0; i < values.length; i++) text += `$${i + 1}` + strings[i + 1];
  return run(text, values);
}
