import { betterAuth, APIError } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { getDatabase, localEditor, OWNER_EMAIL } from "./database.ts";

async function createAuth() {
  const db = await getDatabase();
  const secret = process.env.BLOG_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Editor authentication needs a secure secret.");
  const origin =
    process.env.BLOG_AUTH_URL ||
    (localEditor()
      ? "http://127.0.0.1:3045"
      : "https://www.dreki-solutions.ai");
  return betterAuth({
    appName: "Dreki Editorial",
    baseURL: origin,
    basePath: "/api/editor-auth",
    secret,
    database: db.pool ?? db.sqlite,
    trustedOrigins: [origin],
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    rateLimit: { enabled: true, window: 60, max: 10, storage: "database" },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (user.email.toLowerCase() !== OWNER_EMAIL)
              throw new APIError("FORBIDDEN", {
                message: "Owner access only.",
              });
            return { data: user };
          },
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: 600,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => {
          if (email.toLowerCase() !== OWNER_EMAIL)
            throw new APIError("FORBIDDEN");
          if (localEditor()) {
            const { writeFile, mkdir } = await import("node:fs/promises");
            await mkdir(".codex-tmp/blog-editor", { recursive: true });
            await writeFile(
              ".codex-tmp/blog-editor/local-mail.json",
              JSON.stringify({
                email,
                url,
                createdAt: new Date().toISOString(),
              }),
              { mode: 0o600 },
            );
            return;
          }
          const key = process.env.RESEND_API_KEY;
          const from =
            process.env.BLOG_FROM_EMAIL || process.env.AUDIT_FROM_EMAIL;
          if (!key || !from)
            throw new APIError("SERVICE_UNAVAILABLE", {
              message: "Sign-in email delivery is not configured.",
            });
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from,
              to: [OWNER_EMAIL],
              subject: "Sign in to Dreki Editorial",
              text: `Use this link to open your private editor. It expires in 10 minutes and can be used once.\n\n${url}\n\nIf you didn't request this, ignore this email.`,
            }),
            signal: AbortSignal.timeout(12000),
          });
          if (!response.ok)
            throw new APIError("SERVICE_UNAVAILABLE", {
              message: "The sign-in email could not be sent. Please try again.",
            });
        },
      }),
      nextCookies(),
    ],
  });
}
type EditorAuth = Awaited<ReturnType<typeof createAuth>>;
const globalAuth = globalThis as unknown as {
  drekiEditorAuth?: Promise<EditorAuth>;
};
export async function getAuth() {
  globalAuth.drekiEditorAuth ??= createAuth().catch((error) => {
    globalAuth.drekiEditorAuth = undefined;
    throw error;
  });
  return globalAuth.drekiEditorAuth;
}
export async function ownerSession(headers: Headers) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  return session?.user.email.toLowerCase() === OWNER_EMAIL &&
    session.user.emailVerified
    ? session
    : null;
}
