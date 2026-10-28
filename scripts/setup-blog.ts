import { getDatabase, schemaSql, localEditor } from "../lib/blog/database.ts";
import { getAuth } from "../lib/blog/auth.ts";
import { getMigrations } from "better-auth/db/migration";

if (process.argv.includes("--production")) process.env.BLOG_LOCAL_DEV = "false";
const db = await getDatabase();
if (db.pool) {
  await db.pool.query("CREATE SCHEMA IF NOT EXISTS dreki_blog");
  await db.pool.query(schemaSql);
}
const auth = await getAuth();
const { runMigrations } = await getMigrations(auth.options);
await runMigrations();
console.log(
  localEditor()
    ? "Local editor storage and authentication are ready. Local sign-in links are saved in .codex-tmp/blog-editor/local-mail.json."
    : "Hosted blog schema and authentication tables are ready.",
);
if (db.pool) await db.pool.end();
