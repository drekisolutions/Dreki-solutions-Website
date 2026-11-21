"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  FilePlus2,
  History,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Mail,
  Monitor,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import ArticleBody from "../../components/blog/ArticleBody";
import ImageLibrary from "./ImageLibrary";
import {
  canPublish,
  validateArticle,
  type ArticleContent,
  type BlogPost,
} from "@/lib/blog/model";
import { newsletterHtml } from "@/lib/blog/newsletter-template";
import type { RichNode } from "@/lib/blog/rich-content";
import "../../blog/blog.css";
import "./editor.css";
const RichWriter = dynamic(() => import("./RichWriter"), {
  ssr: false,
  loading: () => <p>Opening your writing canvas…</p>,
});
const empty = (kind: "blog" | "newsletter" = "blog"): ArticleContent => ({
  title: "",
  slug: "",
  excerpt: "",
  category: kind === "newsletter" ? "The Dispatch" : "Field notes",
  body: "",
  motif: "grid",
  kind,
});
const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
const status = (p: BlogPost) =>
  p.deletedAt
    ? "Trash"
    : p.scheduledAt
      ? "Scheduled"
      : p.published
        ? "Published"
        : "Draft";
type Subscriber = { email: string; subscribed_at: string; status: string };
type Revision = {
  id: string;
  revision: number;
  content: string;
  saved_at: string;
};
type Delivery = { post_id: string; state: string; count: number };
type CheckResult = {
  warnings: string[];
  links: { href: string; result: string }[];
};

export default function BlogEditor({
  localPreview = false,
}: {
  localPreview?: boolean;
}) {
  const [access, setAccess] = useState<"loading" | "login" | "owner">(
    "loading",
  );
  const [posts, setPosts] = useState<BlogPost[]>([]),
    [current, setCurrent] = useState<BlogPost | null>(null),
    [content, setContent] = useState<ArticleContent>(empty());
  const [tab, setTab] = useState<
    "blog" | "newsletter" | "subscribers" | "trash"
  >("blog");
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [preview, setPreview] = useState(false),
    [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [problem, setProblem] = useState(""),
    [linkSent, setLinkSent] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]),
    [subscriberCount, setSubscriberCount] = useState(0),
    [emailReady, setEmailReady] = useState(false),
    [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [emailHeight, setEmailHeight] = useState(700);
  const [newsletterWeb, setNewsletterWeb] = useState(false);
  const [history, setHistory] = useState<Revision[] | null>(null),
    [checks, setChecks] = useState<CheckResult | null>(null),
    [when, setWhen] = useState("");
  const [writerKey, setWriterKey] = useState(0),
    [picker, setPicker] = useState<{ choose: (url: string) => void } | null>(
      null,
    );
  const [autoState, setAutoState] = useState(""),
    [autoBlocked, setAutoBlocked] = useState(false);
  const flight = useRef<Promise<BlogPost | null> | null>(null),
    latest = useRef(content);
  useEffect(() => {
    latest.current = content;
  }, [content]);
  const dirty =
    JSON.stringify(content) !==
    JSON.stringify(current?.draft ?? empty(content.kind));
  const lock = busy || saving;
  async function refresh() {
    const response = await fetch("/api/editor/posts", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    setPosts(data.posts);
    setSubscriberCount(data.subscriberCount);
    setEmailReady(data.emailReady);
    setDeliveries(data.delivery || []);
  }
  useEffect(() => {
    let stopped = false;
    void (async () => {
      try {
        const response = await fetch("/api/editor-auth/get-session", {
          cache: "no-store",
        });
        if (!response.ok) throw Error("Editor sign-in is unavailable.");
        const session = await response.json();
        if (stopped) return;
        if (
          session?.user?.email === "brett@dreki-solutions.ai" &&
          session.user.emailVerified
        ) {
          await refresh();
          if (!stopped) setAccess("owner");
        } else setAccess("login");
      } catch (error) {
        if (!stopped) {
          setAccess("login");
          setProblem(
            error instanceof Error
              ? error.message
              : "The editor could not open.",
          );
        }
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const persistRef = useRef<
    (
      action: "save" | "publish" | "unpublish",
      quiet?: boolean,
    ) => Promise<BlogPost | null>
  >(async () => null);
  useEffect(() => {
    if (
      access !== "owner" ||
      busy ||
      saving ||
      autoBlocked ||
      !dirty ||
      current?.deletedAt ||
      ["subscribers", "trash"].includes(tab) ||
      !validateArticle(content)
    )
      return;
    const timer = setTimeout(() => {
      void persistRef.current("save", true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [content, current, access, busy, saving, dirty, autoBlocked, tab]);
  async function api(action: string, extra: Record<string, unknown> = {}) {
    const response = await fetch("/api/editor/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: current?.id ?? null,
        revision: current?.revision ?? 0,
        content: latest.current,
        action,
        ...extra,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      throw Error(
        response.status === 401
          ? "Your session expired. Sign in in another tab, then save again. Your writing is still here."
          : data.error || "The change could not be saved.",
      );
    return data;
  }
  function accept(post: BlogPost, replace = true) {
    setCurrent(post);
    if (replace) {
      setContent({ ...post.draft });
      latest.current = post.draft;
    }
    setPosts((previous) => [post, ...previous.filter((p) => p.id !== post.id)]);
  }
  async function persist(
    action: "save" | "publish" | "unpublish",
    quiet = false,
  ): Promise<BlogPost | null> {
    if (flight.current) return flight.current;
    const snapshot = latest.current;
    if (action === "publish" && !canPublish(snapshot)) {
      setProblem(
        "Add a summary and at least 80 characters of article text before publishing.",
      );
      return null;
    }
    const newsletter =
      snapshot.kind === "newsletter" &&
      !current?.newsletterSent &&
      action === "publish";
    if (newsletter && !emailReady) {
      setProblem(
        "Newsletter email delivery is not available. Save a draft while the connection is checked.",
      );
      return null;
    }
    if (
      action === "publish" &&
      !window.confirm(
        newsletter
          ? `Publish “${snapshot.title}” on the website and email ${subscriberCount} subscribed readers?\n\nThe email edition sends once. Later edits update only the website.`
          : `Publish “${snapshot.title}” on the website?`,
      )
    )
      return null;
    setSaving(true);
    if (!quiet) setBusy(true);
    setProblem("");
    setAutoState("Saving…");
    const run = (async () => {
      try {
        const data = await api(action, {
          content: snapshot,
          confirmNewsletter: newsletter,
        });
        const post = data.post as BlogPost;
        accept(
          post,
          JSON.stringify(latest.current) === JSON.stringify(snapshot),
        );
        setAutoBlocked(false);
        setAutoState(
          "Saved " +
            new Date(post.updatedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
        );
        if (!quiet)
          setMessage(
            action === "publish"
              ? newsletter
                ? "Published. Newsletter delivery is queued."
                : "Published. The web edition is live."
              : action === "unpublish"
                ? "Unpublished. Your private draft is saved."
                : "Draft saved.",
          );
        if (action === "publish") void refresh().catch(() => {});
        return post;
      } catch (error) {
        setProblem(error instanceof Error ? error.message : "Could not save.");
        setAutoState("Not saved — your writing is still here");
        setAutoBlocked(true);
        return null;
      } finally {
        setSaving(false);
        setBusy(false);
        flight.current = null;
      }
    })();
    flight.current = run;
    return run;
  }
  useEffect(() => {
    persistRef.current = persist;
  });
  function update(patch: Partial<ArticleContent>) {
    setContent((previous) => ({ ...previous, ...patch }));
    setChecks(null);
    setAutoState("Unsaved changes");
  }
  function select(
    post: BlogPost | null,
    kind: "blog" | "newsletter" = tab === "newsletter" ? "newsletter" : "blog",
  ) {
    if (lock) return;
    if (
      dirty &&
      !window.confirm("Leave this draft and discard unsaved changes?")
    )
      return;
    const next = post?.draft ?? empty(kind);
    setCurrent(post);
    setContent({ ...next, kind: next.kind || post?.kind || kind });
    setPreview(false);
    setHistory(null);
    setChecks(null);
    setProblem("");
    setMessage("");
    setAutoState("");
    setAutoBlocked(false);
    setWriterKey((k) => k + 1);
    setWhen("");
    if (post) setTab(post.deletedAt ? "trash" : post.kind || "blog");
  }
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
      const result = await response.json();
      if (!response.ok)
        throw Error(
          result.message || result.error || "Sign-in could not be sent.",
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
    setCurrent(null);
    setContent(empty());
    setPosts([]);
    setAccess("login");
    setLinkSent(false);
  }
  async function changeTab(next: typeof tab) {
    if (lock) return;
    if (
      dirty &&
      !window.confirm("Leave this draft and discard unsaved changes?")
    )
      return;
    setTab(next);
    setCurrent(null);
    setContent(empty(next === "newsletter" ? "newsletter" : "blog"));
    setWriterKey((k) => k + 1);
    setHistory(null);
    setChecks(null);
    setProblem("");
    setMessage("");
    setAutoBlocked(false);
    setAutoState("");
    setPreview(false);
    setSearch("");
    setFilter("all");
    void refresh().catch((error) => setProblem(String(error)));
    if (next === "subscribers") {
      try {
        const response = await fetch("/api/editor/subscribers", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error);
        setSubscribers(data.subscribers);
      } catch (error) {
        setProblem(String(error));
      }
    }
  }
  async function remove(permanent = false) {
    if (!current || lock) return;
    if (
      !window.confirm(
        permanent
          ? `Permanently delete “${current.draft.title}” and its version history? This cannot be undone.`
          : `Move “${current.draft.title}” to Trash? Its web edition and scheduled publication will be removed. Emails already sent cannot be recalled.`,
      )
    )
      return;
    setBusy(true);
    setProblem("");
    try {
      const response = await fetch("/api/editor/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.id,
          revision: current.revision,
          permanent,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setCurrent(null);
      setContent(empty(content.kind));
      setWriterKey((k) => k + 1);
      await refresh();
      setMessage(
        permanent
          ? "Permanently deleted."
          : "Moved to Trash. You can restore the private draft there.",
      );
    } catch (error) {
      setProblem(String(error));
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (!current) return;
    setBusy(true);
    try {
      const data = await api("restore");
      accept(data.post);
      setTab(data.post.kind || "blog");
      setWriterKey((k) => k + 1);
      setMessage("Restored as a private draft.");
    } catch (error) {
      setProblem(String(error));
    } finally {
      setBusy(false);
    }
  }
  async function showHistory() {
    if (!current) return;
    setBusy(true);
    try {
      const response = await fetch("/api/editor/posts?history=" + current.id, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setHistory(data.history);
    } catch (error) {
      setProblem(String(error));
    } finally {
      setBusy(false);
    }
  }
  async function recover(historyId: string) {
    if (
      !window.confirm(
        "Restore this version as the current draft? The published edition will stay unchanged.",
      )
    )
      return;
    setBusy(true);
    try {
      const data = await api("restoreRevision", { historyId });
      accept(data.post);
      setWriterKey((k) => k + 1);
      setHistory(null);
      setAutoBlocked(false);
      setMessage("Earlier version restored to the draft.");
    } catch (error) {
      setProblem(String(error));
    } finally {
      setBusy(false);
    }
  }
  function duplicate() {
    const copy = {
      ...content,
      title: "Copy of " + content.title,
      slug:
        content.slug.slice(0, 70) + "-copy-" + crypto.randomUUID().slice(0, 6),
    };
    setCurrent(null);
    setContent(copy);
    setWriterKey((k) => k + 1);
    setAutoBlocked(false);
    setPreview(false);
    setAutoState("Unsaved copy");
    setHistory(null);
    setMessage("Copy created. It will autosave as a new private draft.");
  }
  async function check() {
    setBusy(true);
    setProblem("");
    try {
      const result = await api("check");
      setChecks(result);
    } catch (error) {
      setProblem(String(error));
    } finally {
      setBusy(false);
    }
  }
  async function schedule(cancel = false) {
    if (!current) return;
    if (!cancel && !when) {
      setProblem("Choose a publication time first.");
      return;
    }
    const newsletter = content.kind === "newsletter" && !current.newsletterSent;
    if (!cancel && newsletter && !emailReady) {
      setProblem("Newsletter email delivery is not configured.");
      return;
    }
    if (
      !cancel &&
      !window.confirm(
        `Schedule “${content.title}” for ${new Date(when).toLocaleString()}${newsletter ? ` and email the subscribed readers at that time` : ""}?\n\nThis schedules a snapshot. Later draft edits will not change it unless you schedule again.`,
      )
    )
      return;
    const saved = dirty ? await persist("save") : current;
    if (!saved) return;
    setBusy(true);
    setProblem("");
    try {
      const result = await api("schedule", {
        id: saved.id,
        revision: saved.revision,
        when: cancel ? null : new Date(when).toISOString(),
        confirmNewsletter: newsletter,
      });
      accept(result.post, false);
      setMessage(
        cancel
          ? "Schedule canceled."
          : "Scheduled. The saved snapshot will publish within a few minutes of the chosen time.",
      );
    } catch (error) {
      setProblem(String(error));
    } finally {
      setBusy(false);
    }
  }
  const visible = posts.filter(
    (p) =>
      (tab === "trash"
        ? Boolean(p.deletedAt)
        : !p.deletedAt && (p.kind || "blog") === tab) &&
      (!search ||
        `${p.draft.title} ${p.draft.category}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (filter === "all" || status(p).toLowerCase() === filter),
  );
  const urlPath = content.kind === "newsletter" ? "/newsletter/" : "/blog/";
  const openLibrary = (choose: (url: string) => void) => setPicker({ choose });
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
          <p>A private workbench for articles and newsletters.</p>
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
            <p role="status">
              {localPreview
                ? "Local preview: the sign-in link was saved on this computer."
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
    <div className="editor-shell editorial-v2">
      <header className="editor-top">
        <div>
          <span className="editor-eyebrow">DREKI / PRIVATE EDITORIAL</span>
          <h1>The workbench.</h1>
          <p className="editor-helper">
            Write once. Make the next edition count.
          </p>
        </div>
        <div className="editor-actions">
          <Link href="/" className="editor-quiet">
            View website <ArrowUpRight size={15} />
          </Link>
          <button disabled={lock} className="editor-quiet" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>
      <nav className="editorial-tabs" aria-label="Editorial sections">
        {[
          ["blog", "Articles"],
          ["newsletter", "Newsletters"],
          ["subscribers", "Subscribers"],
          ["trash", "Trash"],
        ].map(([value, label]) => (
          <button
            key={value}
            disabled={lock}
            aria-pressed={tab === value}
            onClick={() => void changeTab(value as typeof tab)}
          >
            {value === "newsletter" ? (
              <Mail size={16} />
            ) : value === "trash" ? (
              <Trash2 size={16} />
            ) : null}
            {label}
            {value === "trash"
              ? ` (${posts.filter((p) => p.deletedAt).length})`
              : ""}
          </button>
        ))}
      </nav>
      <div className="editor-layout">
        <aside className="editor-sidebar">
          {!["subscribers", "trash"].includes(tab) && (
            <button
              disabled={lock}
              className="editor-primary"
              onClick={() => select(null)}
            >
              <FilePlus2 size={16} /> New{" "}
              {tab === "newsletter" ? "newsletter" : "article"}
            </button>
          )}
          {tab === "subscribers" ? (
            <p>{subscriberCount} active subscribers</p>
          ) : (
            <>
              <label className="editor-search">
                <Search size={15} />
                <input
                  aria-label="Search editions"
                  placeholder="Search title or category"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {tab !== "trash" && (
                <label className="editor-filter">
                  Show
                  <select
                    aria-label="Filter editions"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All editions</option>
                    <option value="draft">Drafts</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </label>
              )}
              <p className="editor-eyebrow">{visible.length} EDITIONS</p>
              <nav aria-label="Articles">
                {visible.map((post) => (
                  <button
                    key={post.id}
                    disabled={lock}
                    className={`editor-post-item ${current?.id === post.id ? "is-selected" : ""}`}
                    onClick={() => select(post)}
                  >
                    <span>
                      {status(post)}
                      {post.kind === "newsletter" ? " / Newsletter" : ""}
                    </span>
                    <strong>{post.draft.title}</strong>
                    <small>
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </small>
                  </button>
                ))}
              </nav>
              {!visible.length && (
                <p className="editor-empty">
                  {tab === "trash"
                    ? "Trash is empty."
                    : "No editions match. Start a new draft."}
                </p>
              )}
            </>
          )}
        </aside>
        <section className="editor-workspace">
          {problem && (
            <div role="alert" className="editor-error">
              {problem}
              {autoBlocked && (
                <button
                  disabled={lock}
                  onClick={() => {
                    setAutoBlocked(false);
                    void persist("save");
                  }}
                >
                  Try saving again
                </button>
              )}
            </div>
          )}
          {message && (
            <div role="status" className="editor-notice">
              <Check size={16} />
              {message}
            </div>
          )}
          {tab === "subscribers" ? (
            <>
              <div className="editor-workspace-heading">
                <div>
                  <span className="editor-eyebrow">
                    THE DISPATCH / SUBSCRIBERS
                  </span>
                  <h2>{subscriberCount} active readers.</h2>
                </div>
                <a
                  href="/api/editor/subscribers?format=csv"
                  className="editor-secondary"
                >
                  Export CSV <ArrowUpRight size={15} />
                </a>
              </div>
              <p>
                Newsletters email active subscribers only. Each email includes
                an unsubscribe link.
              </p>
              <div className="editor-subscriber-list">
                {subscribers.map((person) => (
                  <div key={person.email}>
                    <strong>{person.email}</strong>
                    <span>
                      {new Date(person.subscribed_at).toLocaleDateString()} ·{" "}
                      {person.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : current?.deletedAt ? (
            <div className="trash-workspace">
              <span className="editor-eyebrow">IN TRASH</span>
              <h2>{current.draft.title}</h2>
              <p>
                Restore this edition as a private draft, or delete it
                permanently. Emails already sent are retained as delivery
                records.
              </p>
              <div className="editor-actions">
                <button
                  disabled={lock}
                  className="editor-primary"
                  onClick={restore}
                >
                  <RotateCcw size={16} /> Restore draft
                </button>
                <button
                  disabled={lock}
                  className="editor-delete editor-secondary"
                  onClick={() => remove(true)}
                >
                  <Trash2 size={16} /> Permanently delete
                </button>
              </div>
            </div>
          ) : tab === "trash" ? (
            <p>Select an edition in Trash to restore it.</p>
          ) : (
            <>
              <div className="editor-workspace-heading">
                <span className="editor-eyebrow">
                  {content.kind === "newsletter"
                    ? "THE DISPATCH / NEWSLETTER"
                    : "ARTICLE / DRAFT WORKSPACE"}
                </span>
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
              <div className="edition-save-status" role="status">
                {saving ? (
                  <LoaderCircle size={14} className="editor-spinner" />
                ) : (
                  <Check size={14} />
                )}{" "}
                {autoState ||
                  (dirty
                    ? "Unsaved changes"
                    : current
                      ? "All changes saved"
                      : "Start with a title. Drafts save automatically.")}{" "}
                {current?.scheduledAt && (
                  <span>
                    {" "}
                    · Scheduled {new Date(current.scheduledAt).toLocaleString()}
                  </span>
                )}
              </div>
              {preview ? (
                <>
                  <div className="editor-actions preview-modes">
                    <button
                      aria-pressed={!mobile}
                      onClick={() => setMobile(false)}
                    >
                      <Monitor size={15} /> Desktop
                    </button>
                    <button
                      aria-pressed={mobile}
                      onClick={() => setMobile(true)}
                    >
                      <Smartphone size={15} /> Phone
                    </button>
                    {content.kind === "newsletter" && (
                      <>
                        <button
                          aria-pressed={!newsletterWeb}
                          onClick={() => setNewsletterWeb(false)}
                        >
                          Email
                        </button>
                        <button
                          aria-pressed={newsletterWeb}
                          onClick={() => setNewsletterWeb(true)}
                        >
                          Web edition
                        </button>
                      </>
                    )}
                  </div>
                  {(content.kind !== "newsletter" || newsletterWeb) && (
                    <section
                      className={`blog-card-preview ${mobile ? "is-mobile" : ""}`}
                      aria-label="Edition card preview"
                    >
                      <span className="editor-eyebrow">
                        {content.kind === "newsletter"
                          ? "NEWSLETTER ARCHIVE CARD"
                          : "BLOG CARD PREVIEW"}
                      </span>
                      <Image
                        src={
                          content.imageUrl ||
                          `/images/cards/blog-${content.motif}.webp`
                        }
                        alt={content.imageAlt || ""}
                        width={800}
                        height={460}
                        unoptimized
                      />
                      <div>
                        <span className="editor-eyebrow">
                          {content.category}
                        </span>
                        <h3>{content.title || "Your article title"}</h3>
                        <span>Read article ↗</span>
                      </div>
                    </section>
                  )}
                  <div
                    className={`edition-preview ${mobile ? "is-mobile" : ""}`}
                  >
                    {content.kind === "newsletter" && !newsletterWeb ? (
                      <iframe
                        key={mobile ? "phone" : "desktop"}
                        title="Newsletter email preview"
                        className="newsletter-email-frame"
                        sandbox="allow-same-origin"
                        srcDoc={newsletterHtml(content, "#", "")}
                        style={{ height: emailHeight }}
                        onLoad={(event) => {
                          const height =
                            event.currentTarget.contentDocument?.documentElement
                              .scrollHeight;
                          if (height) setEmailHeight(Math.max(480, height));
                        }}
                      />
                    ) : (
                      <article className="editor-preview">
                        <span className="editor-eyebrow">
                          {content.category}
                        </span>
                        <h2>{content.title || "Your edition title"}</h2>
                        <p className="editor-preview-excerpt">
                          {content.excerpt}
                        </p>
                        {content.imageUrl && (
                          <Image
                            className="blog-cover"
                            src={content.imageUrl}
                            alt={content.imageAlt || ""}
                            width={1600}
                            height={1000}
                            unoptimized
                          />
                        )}
                        <ArticleBody
                          body={content.body}
                          richDoc={content.richDoc}
                        />
                      </article>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="editor-fields">
                    <label>
                      {content.kind === "newsletter"
                        ? "Newsletter subject / title"
                        : "Article title"}
                      <input
                        maxLength={140}
                        disabled={busy}
                        value={content.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          update({
                            title,
                            ...(!current &&
                            content.slug === slugify(content.title)
                              ? { slug: slugify(title) }
                              : {}),
                          });
                        }}
                        placeholder="An idea worth sharing"
                      />
                    </label>
                    <div className="editor-fields-row">
                      <label>
                        Category
                        <input
                          maxLength={60}
                          value={content.category}
                          disabled={busy}
                          onChange={(e) => update({ category: e.target.value })}
                        />
                      </label>
                      <label>
                        Fallback card image
                        <select
                          value={content.motif}
                          disabled={busy}
                          onChange={(e) =>
                            update({
                              motif: e.target.value as ArticleContent["motif"],
                            })
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
                        <span>{urlPath}</span>
                        <input
                          aria-label="Article web address"
                          disabled={
                            busy ||
                            Boolean(current?.published) ||
                            Boolean(current?.scheduledAt)
                          }
                          maxLength={100}
                          value={content.slug}
                          onChange={(e) => update({ slug: e.target.value })}
                        />
                      </span>
                    </label>
                    <label>
                      {content.kind === "newsletter"
                        ? "Inbox preview / short summary"
                        : "Short summary"}
                      <textarea
                        maxLength={300}
                        rows={2}
                        disabled={busy}
                        value={content.excerpt}
                        onChange={(e) => update({ excerpt: e.target.value })}
                      />
                    </label>
                  </div>
                  <section
                    className="editor-image-panel"
                    aria-label="Article cover image"
                  >
                    <div>
                      <strong>Cover image</strong>
                      <p className="editor-helper">
                        Shown on the article card and at the start of the
                        edition.
                      </p>
                    </div>
                    {content.imageUrl && (
                      <Image
                        className="editor-cover"
                        src={content.imageUrl}
                        alt={content.imageAlt || "Cover preview"}
                        width={800}
                        height={500}
                        unoptimized
                      />
                    )}
                    <div className="editor-actions">
                      <button
                        disabled={lock}
                        className="editor-secondary"
                        onClick={() =>
                          openLibrary((imageUrl) => update({ imageUrl }))
                        }
                      >
                        <ImagePlus size={16} />
                        {content.imageUrl
                          ? "Replace cover"
                          : "Choose or upload image"}
                      </button>
                      {content.imageUrl && (
                        <button
                          disabled={lock}
                          className="editor-quiet"
                          onClick={() => update({ imageUrl: "", imageAlt: "" })}
                        >
                          Remove cover
                        </button>
                      )}
                    </div>
                    {content.imageUrl && (
                      <label>
                        Cover description
                        <input
                          disabled={busy}
                          maxLength={300}
                          value={content.imageAlt || ""}
                          onChange={(e) => update({ imageAlt: e.target.value })}
                        />
                      </label>
                    )}
                  </section>
                  <RichWriter
                    key={writerKey}
                    content={content}
                    disabled={busy}
                    onChange={(richDoc: RichNode, body: string) =>
                      update({ richDoc, body })
                    }
                    onPickImage={(insert) => openLibrary(insert)}
                    onProblem={setProblem}
                  />
                  <details className="editor-detail">
                    <summary>Search and sharing preview</summary>
                    <div className="editor-fields">
                      <label>
                        Search title
                        <input
                          maxLength={140}
                          value={content.seoTitle || ""}
                          placeholder={content.title}
                          onChange={(e) => update({ seoTitle: e.target.value })}
                        />
                      </label>
                      <label>
                        Search description
                        <textarea
                          rows={2}
                          maxLength={300}
                          value={content.seoDescription || ""}
                          placeholder={content.excerpt}
                          onChange={(e) =>
                            update({ seoDescription: e.target.value })
                          }
                        />
                      </label>
                      <div className="search-result-preview">
                        <span>
                          dreki-solutions.ai{urlPath}
                          {content.slug}
                        </span>
                        <strong>
                          {content.seoTitle ||
                            content.title ||
                            "Search result title"}
                        </strong>
                        <p>
                          {content.seoDescription ||
                            content.excerpt ||
                            "Search engines may show a different excerpt."}
                        </p>
                      </div>
                      <div className="editor-actions">
                        <button
                          disabled={lock}
                          className="editor-secondary"
                          onClick={() =>
                            openLibrary((socialImage) =>
                              update({ socialImage }),
                            )
                          }
                        >
                          Choose sharing image
                        </button>
                        {content.socialImage && (
                          <button
                            disabled={lock}
                            onClick={() => update({ socialImage: "" })}
                          >
                            Use cover image instead
                          </button>
                        )}
                      </div>
                      {(content.socialImage || content.imageUrl) && (
                        <Image
                          className="editor-cover"
                          src={(content.socialImage || content.imageUrl)!}
                          alt="Social sharing preview"
                          width={800}
                          height={420}
                          unoptimized
                        />
                      )}
                      <p className="editor-helper">
                        Sharing preview: {content.seoTitle || content.title} ·{" "}
                        {content.seoDescription || content.excerpt}
                      </p>
                    </div>
                  </details>
                </>
              )}
              <section className="publishing-panel">
                <div className="editor-actions">
                  <button
                    disabled={lock || !validateArticle(content)}
                    className="editor-secondary"
                    onClick={check}
                  >
                    <Check size={15} /> Prepublication check
                  </button>
                  <button
                    disabled={lock || !current}
                    className="editor-quiet"
                    onClick={showHistory}
                  >
                    <History size={15} /> Version history
                  </button>
                  <button
                    disabled={lock || !content.title}
                    className="editor-quiet"
                    onClick={duplicate}
                  >
                    <Copy size={15} /> Duplicate
                  </button>
                </div>
                {checks && (
                  <div className="publishing-checks">
                    <h3>Before you publish</h3>
                    {checks.warnings.length ? (
                      <ul>
                        {checks.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Title, summary, writing, and image descriptions are
                        ready.
                      </p>
                    )}
                    {checks.links.length > 0 && (
                      <ul>
                        {checks.links.map((link) => (
                          <li key={link.href}>
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.href}
                            </a>{" "}
                            — {link.result}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="editor-helper">
                      Up to 20 links are checked. Some sites block automatic
                      checks; open those links to verify.
                    </p>
                  </div>
                )}
                {history && (
                  <div className="version-history">
                    <h3>Saved versions</h3>
                    <p>
                      The latest 100 saved versions are kept. Restoring changes
                      the draft. The published edition stays unchanged.
                    </p>
                    <button
                      className="editor-quiet"
                      onClick={() => setHistory(null)}
                    >
                      Close history
                    </button>
                    {!history.length && (
                      <p>Versions appear after the next save.</p>
                    )}
                    {history.map((version) => (
                      <div key={version.id}>
                        <span>
                          Version {version.revision} ·{" "}
                          {new Date(version.saved_at).toLocaleString()}
                        </span>
                        <strong>{JSON.parse(version.content).title}</strong>
                        <button
                          disabled={lock}
                          onClick={() => recover(version.id)}
                        >
                          Restore this version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <details className="editor-detail">
                  <summary>
                    <CalendarClock size={16} /> Schedule publication
                  </summary>
                  <p>
                    The schedule uses your device’s time zone:{" "}
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}. It
                    publishes the saved snapshot; reschedule to include later
                    edits.
                  </p>
                  <label>
                    Publication date and time
                    <input
                      type="datetime-local"
                      value={when}
                      disabled={lock}
                      onChange={(e) => setWhen(e.target.value)}
                    />
                  </label>
                  <div className="editor-actions">
                    <button
                      disabled={lock || !current || !when}
                      className="editor-secondary"
                      onClick={() => schedule()}
                    >
                      {content.kind === "newsletter" && !current?.newsletterSent
                        ? "Schedule web edition & email"
                        : "Schedule publication"}
                    </button>
                    {current?.scheduledAt && (
                      <button disabled={lock} onClick={() => schedule(true)}>
                        Cancel schedule
                      </button>
                    )}
                  </div>
                  {!current && (
                    <p>Save the first draft to enable scheduling.</p>
                  )}
                  {current?.scheduledAt && (
                    <p>
                      Currently scheduled:{" "}
                      {new Date(current.scheduledAt).toLocaleString()}
                    </p>
                  )}
                </details>
                {content.kind === "newsletter" && (
                  <div className="newsletter-delivery">
                    <strong>Newsletter delivery</strong>
                    <p>
                      {subscriberCount} active subscribers.{" "}
                      {current?.newsletterSent
                        ? "The first email edition is already queued or sent. Further publishing updates only the web edition."
                        : "Publishing emails the subscribed readers once, with unsubscribe links."}
                    </p>
                    {localPreview && (
                      <p>Local preview: no real emails are sent.</p>
                    )}
                    {!emailReady && (
                      <p role="alert">
                        Email delivery is not configured. Drafts are still
                        available.
                      </p>
                    )}
                    <div className="editor-actions">
                      {deliveries
                        .filter((d) => d.post_id === current?.id)
                        .map((d) => (
                          <span key={d.state}>
                            {d.state === "sent"
                              ? "Accepted by email provider"
                              : d.state === "review"
                                ? "Needs review"
                                : d.state}
                            : {d.count}
                          </span>
                        ))}
                    </div>
                    <button
                      className="editor-quiet"
                      disabled={lock}
                      onClick={() =>
                        void refresh().catch((error) =>
                          setProblem(String(error)),
                        )
                      }
                    >
                      Refresh delivery status
                    </button>
                  </div>
                )}
              </section>
              <footer className="editor-savebar">
                <div>
                  {current && (
                    <button
                      disabled={lock}
                      className="editor-quiet editor-delete"
                      onClick={() => remove()}
                    >
                      <Trash2 size={15} /> Move to Trash
                    </button>
                  )}
                  {current?.published && (
                    <>
                      <a
                        href={urlPath + current.published.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View web edition <ArrowUpRight size={14} />
                      </a>
                      <button
                        disabled={lock}
                        className="editor-quiet"
                        onClick={() => persist("unpublish")}
                      >
                        Unpublish
                      </button>
                    </>
                  )}
                </div>
                <div>
                  <button
                    disabled={lock}
                    className="editor-secondary"
                    onClick={() => persist("save")}
                  >
                    <Save size={15} />
                    {saving ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    disabled={lock || !canPublish(content)}
                    className="editor-primary"
                    onClick={() => persist("publish")}
                  >
                    <Send size={15} />
                    {content.kind === "newsletter" && !current?.newsletterSent
                      ? "Publish & email subscribers"
                      : current?.published
                        ? "Publish changes"
                        : "Publish edition"}
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
      {picker && (
        <ImageLibrary
          onChoose={(url) => {
            picker.choose(url);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
