import pg from "pg";
import type { DatabaseSync } from "node:sqlite";

export const OWNER_EMAIL = "brett@dreki-solutions.ai";
export const localEditor = () =>
  process.env.BLOG_LOCAL_DEV === "true" &&
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL;
export const blogConfigured = () =>
  localEditor() || Boolean(process.env.BLOG_DATABASE_URL);

type Connection =
  { pool: pg.Pool; sqlite?: never } | { sqlite: DatabaseSync; pool?: never };
const globalDatabase = globalThis as unknown as {
  drekiBlogDatabase?: Promise<Connection>;
};

export async function getDatabase(): Promise<Connection> {
  if (!blogConfigured()) throw new Error("Blog storage is not configured.");
  globalDatabase.drekiBlogDatabase ??= (async () => {
    if (localEditor()) {
      // Loaded only in Node local development. Never used on a hosted instance.
      const moduleName = "node:sqlite";
      const { DatabaseSync } = (await import(
        /* webpackIgnore: true */ moduleName
      )) as typeof import("node:sqlite");
      const { mkdir } = await import("node:fs/promises");
      await mkdir(".codex-tmp/blog-editor", { recursive: true });
      const sqlite = new DatabaseSync(
        process.env.BLOG_LOCAL_DB_PATH ||
          ".codex-tmp/blog-editor/content.sqlite",
      );
      sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
      sqlite.exec(schemaSql);
      return { sqlite };
    }
    const url = new URL(process.env.BLOG_DATABASE_URL!);
    if (!["postgres:", "postgresql:"].includes(url.protocol))
      throw new Error("Invalid blog database configuration.");
    for (const option of [
      "ssl",
      "sslmode",
      "sslcert",
      "sslkey",
      "sslrootcert",
      "channel_binding",
    ])
      url.searchParams.delete(option);
    const pool = new pg.Pool({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
      options: "-c search_path=dreki_blog",
      max: 2,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 5000,
      allowExitOnIdle: true,
    });
    pool.on("error", () =>
      console.error("Blog database connection interrupted."),
    );
    return { pool };
  })();
  return globalDatabase.drekiBlogDatabase;
}

export const schemaSql = `
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, draft TEXT NOT NULL,
  published TEXT, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, published_at TEXT
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY, subscribed_at TEXT NOT NULL,
  consent_version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'subscribed'
);
CREATE TABLE IF NOT EXISTS newsletter_limits (
  bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires TEXT NOT NULL
);`;

export async function query<
  T extends Record<string, unknown> = Record<string, unknown>,
>(sql: string, params: (string | number | null)[] = []): Promise<T[]> {
  const db = await getDatabase();
  if (db.pool) return (await db.pool.query(sql, params)).rows as T[];
  const ordered: (string | number | null)[] = [];
  const localSql = sql.replace(/\$(\d+)/g, (_match, index) => {
    ordered.push(params[Number(index) - 1]);
    return "?";
  });
  return db.sqlite.prepare(localSql).all(...ordered) as T[];
}
