import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeExpectations = [
  { path: "/", title: "Custom Agentic Software | Dreki Solutions", h1: "Give the repetitive work to an agent." },
  { path: "/services", title: "Agentic Software Services | Dreki Solutions", h1: "Move the customer and operational work forward." },
  { path: "/products", title: "Agentic Software Products | Dreki Solutions", h1: "A product line shaped by real operating friction." },
  { path: "/about", title: "About | Dreki Solutions", h1: "Discipline for the work behind the work." },
  { path: "/contact", title: "Contact | Dreki Solutions", h1: "Schedule a consultation." },
];

const forbiddenPublicTerms = [
  "lead generation",
  "LeadpulseAI",
  "ReviewShield",
  "SocialPulse",
  "guaranteed results",
  "guaranteed rankings",
  "guaranteed savings",
  "Google partner",
  "Google partnership",
  "Google certified",
  "Google endorsement",
  "Google affiliation",
];

let workerPromise;
const renderedPages = new Map();

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/gi, (_, entity) => ({
      amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
    })[entity.toLowerCase()]);
}

function textContent(markup) {
  return decodeHtml(markup.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function visibleMarkup(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[\s\S]*?<\/template>/gi, " ");
}

function attributesFor(tag) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), decodeHtml(match[2] ?? match[3] ?? match[4] ?? ""));
  }
  return attributes;
}

function tagsNamed(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

async function render(path) {
  if (renderedPages.has(path)) return renderedPages.get(path);
  if (!workerPromise) {
    workerPromise = (async () => {
      const workerUrl = new URL("../dist/server/index.js", import.meta.url);
      workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
      return (await import(workerUrl.href)).default;
    })();
  }
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const result = {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    html: await response.text(),
  };
  renderedPages.set(path, result);
  return result;
}

test("server-renders all five public routes with route-specific content", async () => {
  for (const expected of routeExpectations) {
    const { status, contentType, html } = await render(expected.path);
    assert.equal(status, 200, `${expected.path} must return 200`);
    assert.match(contentType, /^text\/html\b/i);
    assert.match(html, /<main\b/i);
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    assert.equal(textContent(title?.[1] ?? ""), expected.title);
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    assert.equal(textContent(h1?.[1] ?? ""), expected.h1);
    assert.ok(textContent(visibleMarkup(html)).split(/\s+/).length >= 70, `${expected.path} needs meaningful SSR copy`);
  }
});

test("renders a consistent five-page menu and working contact actions", async () => {
  const expectedRoutes = routeExpectations.map((route) => route.path);
  for (const route of routeExpectations) {
    const { html } = await render(route.path);
    const hrefs = tagsNamed(visibleMarkup(html), "a").map((tag) => attributesFor(tag).get("href"));
    for (const expectedRoute of expectedRoutes) {
      assert.ok(hrefs.includes(expectedRoute), `${route.path} is missing navigation to ${expectedRoute}`);
    }
    assert.ok(hrefs.includes("/contact#consultation"), `${route.path} is missing consultation CTA`);
  }

  const { html } = await render("/contact");
  const markup = visibleMarkup(html);
  const hrefs = tagsNamed(markup, "a").map((tag) => attributesFor(tag).get("href"));
  assert.ok(hrefs.includes("tel:+16026775926"));
  assert.ok(hrefs.some((href) => href?.startsWith("mailto:Brett@dreki-solutions.com")));
  assert.match(markup, /<form\b/i);
  for (const field of [
    "fullName",
    "email",
    "phone",
    "businessName",
    "website",
    "industry",
    "contactMethod",
    "workflow",
  ]) {
    assert.match(markup, new RegExp(`\\bname=["']${field}["']`, "i"), `missing ${field} form field`);
  }
  assert.match(textContent(markup), /Optimization audit request/i);
  assert.match(textContent(markup), /Schedule a Consultation/i);
});

test("positions service-industry offerings before aviation offerings", async () => {
  const servicesText = textContent(visibleMarkup((await render("/services")).html));
  assert.ok(servicesText.indexOf("Service-industry agentic software") < servicesText.indexOf("Aviation agentic software services"));
  assert.match(servicesText, /Specialized systems for charter operations/i);
  assert.match(servicesText, /human control of operational and regulatory decisions/i);
});

test("publishes six service and six aviation product positions", async () => {
  const { html } = await render("/products");
  const markup = visibleMarkup(html);
  const text = textContent(markup);
  for (let index = 1; index <= 6; index += 1) {
    assert.match(text, new RegExp(`Service Product ${String(index).padStart(2, "0")}`));
  }
  assert.match(text, /Valkyrie 135/);
  for (let index = 2; index <= 6; index += 1) {
    assert.match(text, new RegExp(`Aviation Product ${String(index).padStart(2, "0")}`));
  }
  assert.equal((markup.match(/class="product-card/g) ?? []).length, 12);
});

test("ships page-turn transitions, route glare, and the approved hero treatment", async () => {
  const [linkSource, chromeSource, styles, experience] = await Promise.all([
    readFile(new URL("../app/components/PageTurnLink.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/DrekiExperience.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(linkSource, /startViewTransition/);
  assert.match(styles, /page-fold-old/);
  assert.match(styles, /fallback-page-turn/);
  assert.match(chromeSource, /header-divider__glare/);
  assert.match(styles, /header-glare/);
  assert.match(styles, /obsidian-scales/);
  assert.match(styles, /hex-border-glare/);
  assert.match(styles, /dreki-lattice-backdrop\.webp/);
  for (const safeguard of ["prefers-reduced-motion: reduce", "pointer: coarse", "saveData", "visibilityState", "cancelAnimationFrame"]) {
    assert.match(`${styles}\n${experience}`, new RegExp(safeguard.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(`${styles}\n${experience}`, /dreki-intro|Replay Intro|AudioContext/i);
});

test("keeps unsupported claims and retired product names out of every route", async () => {
  for (const route of routeExpectations) {
    const html = (await render(route.path)).html.toLowerCase();
    for (const term of forbiddenPublicTerms) {
      assert.equal(html.includes(term.toLowerCase()), false, `${route.path} contains ${term}`);
    }
  }
});

test("ships route metadata, structured data, sitemap routes, and brand assets", async () => {
  const home = (await render("/")).html;
  assert.match(home, /application\/ld\+json/i);
  assert.match(home.replace(/\\u002f/gi, "/"), /\/brand\/dreki-logo-horizontal-768\.webp/i);
  assert.match(home.replace(/\\u002f/gi, "/"), /\/brand\/dreki-icon-1024\.webp/i);
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  for (const route of ["services", "products", "about", "contact"]) assert.match(sitemap, new RegExp(route));
  const backdrop = await readFile(new URL("../public/brand/dreki-lattice-backdrop.webp", import.meta.url));
  assert.equal(backdrop.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(backdrop.subarray(8, 12).toString("ascii"), "WEBP");
});

test("ships the bespoke social card at the declared dimensions", async () => {
  const image = await readFile(new URL("../public/og-wide.png", import.meta.url));
  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});
