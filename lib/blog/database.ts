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
  | { pool: pg.Pool; sqlite?: never }
  | { sqlite: DatabaseSync; pool?: never };
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
      const columns = sqlite
        .prepare("PRAGMA table_info(blog_posts)")
        .all()
        .map((row) => row.name);
      for (const [name, definition] of Object.entries({
        kind: "TEXT NOT NULL DEFAULT 'blog'",
        deleted_at: "TEXT",
        scheduled_at: "TEXT",
        scheduled_content: "TEXT",
      }))
        if (!columns.includes(name))
          sqlite.exec(
            `ALTER TABLE blog_posts ADD COLUMN ${name} ${definition}`,
          );
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
      ssl: {
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA
          ? { ca: process.env.DATABASE_SSL_CA }
          : {}),
      },
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
CREATE TABLE IF NOT EXISTS blog_images (id TEXT PRIMARY KEY, data BYTEA NOT NULL);
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, draft TEXT NOT NULL,
  published TEXT, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, published_at TEXT,
  kind TEXT NOT NULL DEFAULT 'blog', deleted_at TEXT, scheduled_at TEXT, scheduled_content TEXT
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY, subscribed_at TEXT NOT NULL,
  consent_version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'subscribed'
);
CREATE TABLE IF NOT EXISTS newsletter_limits (
  bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS blog_revisions (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, revision INTEGER NOT NULL, content TEXT NOT NULL, saved_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS blog_revisions_post ON blog_revisions(post_id,revision);
CREATE TABLE IF NOT EXISTS newsletter_issues (post_id TEXT PRIMARY KEY, content TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS newsletter_deliveries (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, email TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_at TEXT NOT NULL, first_attempt TEXT, provider_id TEXT, error TEXT, UNIQUE(post_id,email));
CREATE INDEX IF NOT EXISTS newsletter_delivery_queue ON newsletter_deliveries(state,next_at);
`;

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

export async function withBlogTransaction<T>(
  operation: (sql: typeof query) => Promise<T>,
): Promise<T> {
  const db = await getDatabase();
  if (db.sqlite) {
    db.sqlite.exec("BEGIN IMMEDIATE");
    try {
      const result = await operation(query);
      db.sqlite.exec("COMMIT");
      return result;
    } catch (error) {
      db.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const sql: typeof query = async (text, params = []) =>
      (await client.query(text, params)).rows;
    const result = await operation(sql);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
