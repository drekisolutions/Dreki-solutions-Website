"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bold,
  Check,
  Eye,
  FilePlus2,
  Heading2,
  Italic,
  List,
  LoaderCircle,
  LogOut,
  Save,
  Send,
  Users,
} from "lucide-react";
import ArticleBody from "../../components/blog/ArticleBody";
import type { ArticleContent, BlogPost } from "@/lib/blog/model";
import "../../blog/blog.css";
import "./editor.css";

const empty: ArticleContent = {
  title: "",
  slug: "",
  excerpt: "",
  category: "Field notes",
  body: "",
  motif: "grid",
};
type Subscriber = { email: string; subscribed_at: string; status: string };
const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

export default function BlogEditor({
  localPreview = false,
}: {
  localPreview?: boolean;
}) {
  const [access, setAccess] = useState<"loading" | "login" | "owner">(
    "loading",
  );
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [current, setCurrent] = useState<BlogPost | null>(null);
  const [content, setContent] = useState<ArticleContent>({ ...empty });
  const [preview, setPreview] = useState(false);
  const [view, setView] = useState<"posts" | "subscribers">("posts");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const writing = useRef<HTMLTextAreaElement>(null);
  const dirty =
    JSON.stringify(content) !== JSON.stringify(current?.draft ?? empty);

  useEffect(() => {
    let stopped = false;
    async function load() {
      try {
        const session = await fetch("/api/editor-auth/get-session", {
          cache: "no-store",
        });
        const value = await session.json();
        if (
          !stopped &&
          value?.user?.email === "brett@dreki-solutions.ai" &&
          value.user.emailVerified
        ) {
          const response = await fetch("/api/editor/posts", {
            cache: "no-store",
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          if (!stopped) {
            setPosts(result.posts);
            setAccess("owner");
          }
        } else if (!stopped) setAccess("login");
      } catch {
        if (!stopped) setAccess("login");
      }
    }
    void load();
    return () => {
      stopped = true;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem("");
    try {
      const response = await fetch("/api/editor-auth/sign-in/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "brett@dreki-solutions.ai",
          callbackURL: "/admin/blog",
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || data.error || "Sign-in link could not be sent.",
        );
      setLinkSent(true);
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Sign-in is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    if (dirty && !window.confirm("Discard unsaved changes and sign out?"))
      return;
    await fetch("/api/editor-auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setContent({ ...empty });
    setCurrent(null);
    setPosts([]);
    setAccess("login");
    setLinkSent(false);
  }
  function select(post: BlogPost | null) {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setCurrent(post);
    setContent({ ...(post?.draft ?? empty) });
    setPreview(false);
    setMessage("");
    setProblem("");
    setView("posts");
  }
  function field<K extends keyof ArticleContent>(
    key: K,
    value: ArticleContent[K],
  ) {
    setContent((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "title" &&
      !current &&
      previous.slug === slugify(previous.title)
        ? { slug: slugify(value) }
        : {}),
    }));
    setMessage("");
  }
  function format(before: string, after = "") {
    const area = writing.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    field(
      "body",
      content.body.slice(0, start) +
        before +
        content.body.slice(start, end) +
        after +
        content.body.slice(end),
    );
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + before.length, end + before.length);
    });
  }
  async function save(action: "save" | "publish" | "unpublish") {
    setBusy(true);
    setProblem("");
    setMessage("");
    try {
      const response = await fetch("/api/editor/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current?.id ?? null,
          revision: current?.revision ?? 0,
          action,
          content,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setProblem(
          "Your session expired. Open the editor in another tab and sign in before trying again. Your text is still here.",
        );
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not save.");
      const saved = data.post as BlogPost;
      setCurrent(saved);
      setContent({ ...saved.draft });
      setPosts((previous) => [
        saved,
        ...previous.filter((post) => post.id !== saved.id),
      ]);
      setMessage(
        action === "publish"
          ? "Published. Your article and carousel card are available on this site."
          : action === "unpublish"
            ? "Unpublished. The draft is still saved privately."
            : saved.published
              ? "Draft saved. The published article is unchanged until you publish again."
              : "Draft saved privately.",
      );
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Could not save your changes.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function showSubscribers() {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setProblem("");
    setMessage("");
    try {
      const response = await fetch("/api/editor/subscribers", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubscribers(data.subscribers);
      setView("subscribers");
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Could not load subscribers.",
      );
    }
  }

  if (access === "loading")
    return (
      <div className="editor-loading">
        <LoaderCircle className="editor-spinner" /> Opening your workbench…
      </div>
    );
  if (access === "login")
    return (
      <div className="editor-login-shell">
        <Link href="/" className="editor-back">
          <ArrowLeft size={15} /> Back to Dreki
        </Link>
        <section className="editor-login">
          <span className="editor-eyebrow">DREKI / PRIVATE EDITORIAL</span>
          <h1>
            Your ideas.
            <br />
            <span>The next edition.</span>
          </h1>
          <p>
            A private workbench for writing, previewing, and publishing your
            field notes.
          </p>
          <form onSubmit={signIn}>
            <label>
              Owner email
              <input type="email" value="brett@dreki-solutions.ai" readOnly />
            </label>
            <button className="editor-primary" disabled={busy}>
              {busy
                ? "Sending…"
                : linkSent
                  ? "Send another sign-in link"
                  : "Email my sign-in link"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          {linkSent && (
            <p role="status" className="editor-notice">
              {localPreview
                ? "Local preview: the link was saved on this computer. No email was sent."
                : "Check your inbox. The link lasts 10 minutes and works once."}
            </p>
          )}
          {problem && (
            <p role="alert" className="editor-error">
              {problem}
            </p>
          )}
          <small>Owner access only. No public registration.</small>
        </section>
      </div>
    );

  return (
    <div className="editor-shell">
      <header className="editor-top">
        <div>
          <span className="editor-eyebrow">DREKI / PRIVATE EDITORIAL</span>
          <h1>The workbench.</h1>
        </div>
        <button className="editor-quiet" onClick={signOut}>
          <LogOut size={15} /> Sign out
        </button>
      </header>
      <div className="editor-layout">
        <aside className="editor-sidebar">
          <button className="editor-primary" onClick={() => select(null)}>
            <FilePlus2 size={16} /> New article
          </button>
          <button className="editor-sidebar-action" onClick={showSubscribers}>
            <Users size={16} /> Newsletter subscribers
          </button>
          <p className="editor-eyebrow">YOUR ARTICLES / {posts.length}</p>
          {posts.length === 0 && (
            <p className="editor-empty">
              A blank page is a good place to start. Create your first article.
            </p>
          )}
          <nav aria-label="Articles">
            {posts.map((post) => (
              <button
                key={post.id}
                className={`editor-post-item ${current?.id === post.id && view === "posts" ? "is-selected" : ""}`}
                onClick={() => select(post)}
              >
                <span>{post.published ? "Published" : "Draft"}</span>
                <strong>{post.draft.title}</strong>
                <small>{new Date(post.updatedAt).toLocaleDateString()}</small>
              </button>
            ))}
          </nav>
        </aside>
        <section className="editor-workspace">
          {problem && (
            <div role="alert" className="editor-error">
              {problem}
            </div>
          )}
          {message && (
            <div role="status" className="editor-notice">
              <Check size={16} />
              {message}
            </div>
          )}
          {view === "subscribers" ? (
            <>
              <div className="editor-workspace-heading">
                <div>
                  <span className="editor-eyebrow">
                    THE DISPATCH / SUBSCRIBERS
                  </span>
                  <h2>{subscribers.length} readers and counting.</h2>
                </div>
                <a
                  className="editor-secondary"
                  href="/api/editor/subscribers?format=csv"
                >
                  Export CSV <ArrowUpRight size={15} />
                </a>
              </div>
              <p className="editor-helper">
                Signups are stored here with their consent date. This list does
                not send campaigns automatically.
              </p>
              <div className="editor-subscriber-list">
                {subscribers.length ? (
                  subscribers.map((person) => (
                    <div key={person.email}>
                      <strong>{person.email}</strong>
                      <span>
                        {new Date(person.subscribed_at).toLocaleDateString()} ·{" "}
                        {person.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No signups yet.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="editor-workspace-heading">
                <div>
                  <span className="editor-eyebrow">
                    {current?.published
                      ? "PUBLISHED ARTICLE / DRAFT WORKSPACE"
                      : "PRIVATE DRAFT"}
                  </span>
                  <span className="editor-dirty">
                    {dirty
                      ? "Unsaved changes"
                      : current
                        ? "All changes saved"
                        : "Start writing"}
                  </span>
                </div>
                <div className="editor-view-switch">
                  <button
                    aria-pressed={!preview}
                    onClick={() => setPreview(false)}
                  >
                    Write
                  </button>
                  <button
                    aria-pressed={preview}
                    onClick={() => setPreview(true)}
                  >
                    <Eye size={14} /> Preview
                  </button>
                </div>
              </div>
              {preview ? (
                <article className="editor-preview">
                  <span className="editor-eyebrow">{content.category}</span>
                  <h2>{content.title || "Your article title"}</h2>
                  <p className="editor-preview-excerpt">
                    {content.excerpt ||
                      "Your article summary will appear here."}
                  </p>
                  <ArticleBody
                    body={
                      content.body ||
                      "Your article will appear here as you write."
                    }
                  />
                </article>
              ) : (
                <div className="editor-fields">
                  <label>
                    Article title
                    <input
                      maxLength={140}
                      value={content.title}
                      onChange={(e) => field("title", e.target.value)}
                      placeholder="An idea worth putting to work"
                    />
                  </label>
                  <div className="editor-fields-row">
                    <label>
                      Category
                      <input
                        maxLength={60}
                        value={content.category}
                        onChange={(e) => field("category", e.target.value)}
                      />
                    </label>
                    <label>
                      Card image
                      <select
                        value={content.motif}
                        onChange={(e) =>
                          field(
                            "motif",
                            e.target.value as ArticleContent["motif"],
                          )
                        }
                      >
                        <option value="grid">Tools & craft</option>
                        <option value="call">Customer response</option>
                        <option value="flow">Connected workflows</option>
                        <option value="paper">Estimates & paperwork</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Web address
                    <span className="editor-slug">
                      <span>/blog/</span>
                      <input
                        aria-label="Article web address"
                        disabled={Boolean(current?.published)}
                        maxLength={100}
                        value={content.slug}
                        onChange={(e) => field("slug", e.target.value)}
                        placeholder="your-article-title"
                      />
                    </span>
                  </label>
                  <label>
                    Short summary
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={content.excerpt}
                      onChange={(e) => field("excerpt", e.target.value)}
                      placeholder="A few lines to help readers decide to open your article."
                    />
                  </label>
                  <div className="editor-body-heading">
                    <label htmlFor="article-body">Your article</label>
                    <span>
                      {content.body.trim()
                        ? content.body.trim().split(/\s+/).length
                        : 0}{" "}
                      words
                    </span>
                  </div>
                  <div
                    className="editor-formatting"
                    role="group"
                    aria-label="Article formatting"
                  >
                    <button
                      type="button"
                      title="Bold"
                      aria-label="Bold"
                      onClick={() => format("**", "**")}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      aria-label="Italic"
                      onClick={() => format("*", "*")}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      title="Heading"
                      aria-label="Heading"
                      onClick={() => format("\n## ")}
                    >
                      <Heading2 size={17} />
                    </button>
                    <button
                      type="button"
                      title="List"
                      aria-label="List"
                      onClick={() => format("\n- ")}
                    >
                      <List size={17} />
                    </button>
                    <span>
                      Write naturally. Use Preview to see the finished article.
                    </span>
                  </div>
                  <textarea
                    id="article-body"
                    ref={writing}
                    className="editor-body"
                    value={content.body}
                    maxLength={60000}
                    onChange={(e) => field("body", e.target.value)}
                    placeholder="Start with the problem your readers know. Then show them a better way."
                    rows={16}
                  />
                </div>
              )}
              <footer className="editor-savebar">
                <div>
                  {current?.published && (
                    <a
                      href={`/blog/${current.published.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View published article <ArrowUpRight size={14} />
                    </a>
                  )}
                  {current?.published && (
                    <button
                      disabled={busy}
                      className="editor-quiet"
                      onClick={() => save("unpublish")}
                    >
                      Unpublish
                    </button>
                  )}
                </div>
                <div>
                  <button
                    disabled={busy}
                    className="editor-secondary"
                    onClick={() => save("save")}
                  >
                    <Save size={15} />
                    {busy ? "Working…" : "Save draft"}
                  </button>
                  <button
                    disabled={busy}
                    className="editor-primary"
                    onClick={() => save("publish")}
                  >
                    <Send size={15} />
                    {current?.published ? "Publish changes" : "Publish article"}
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
