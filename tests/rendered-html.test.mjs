import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedTitle =
  "Dreki Solutions | Custom AI Agent Systems for Service Businesses";
const expectedDescription =
  "Subscription-based AI agent systems that help service businesses improve customer response, reputation, content operations, and recurring workflows.";
const expectedSections = ["outcomes", "system", "method", "about", "contact"];
const forbiddenPublicTerms = [
  "lead generation",
  "aviation",
  "Valkyrie",
  "LeadpulseAI",
  "ReviewShield",
  "SocialPulse",
  "guaranteed results",
  "guaranteed result",
  "guaranteed rankings",
  "guaranteed savings",
  "Google partner",
  "Google partnership",
  "Google certified",
  "Google endorsement",
  "Google affiliation",
];

let renderedPage;

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(
      /&(amp|quot|apos|lt|gt|nbsp);/gi,
      (_, entity) =>
        ({
          amp: "&",
          quot: '"',
          apos: "'",
          lt: "<",
          gt: ">",
          nbsp: " ",
        })[entity.toLowerCase()],
    );
}

function textContent(markup) {
  return decodeHtml(markup.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attributesFor(tag) {
  const attributes = new Map();
  const attributePattern =
    /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  for (const match of tag.matchAll(attributePattern)) {
    attributes.set(
      match[1].toLowerCase(),
      decodeHtml(match[2] ?? match[3] ?? match[4] ?? ""),
    );
  }

  return attributes;
}

function tagsNamed(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    (match) => match[0],
  );
}

function schemaNodes(value, nodes = []) {
  if (Array.isArray(value)) {
    for (const item of value) schemaNodes(item, nodes);
    return nodes;
  }

  if (value && typeof value === "object") {
    if (Object.hasOwn(value, "@type")) nodes.push(value);
    for (const child of Object.values(value)) schemaNodes(child, nodes);
  }

  return nodes;
}

async function render() {
  if (!renderedPage) {
    renderedPage = (async () => {
      const workerUrl = new URL("../dist/server/index.js", import.meta.url);
      workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
      const { default: worker } = await import(workerUrl.href);
      const response = await worker.fetch(
        new Request("http://localhost/", {
          headers: { accept: "text/html" },
        }),
        {
          ASSETS: {
            fetch: async () => new Response("Not found", { status: 404 }),
          },
        },
        {
          waitUntil() {},
          passThroughOnException() {},
        },
      );

      return {
        contentType: response.headers.get("content-type") ?? "",
        html: await response.text(),
        status: response.status,
      };
    })();
  }

  return renderedPage;
}

test("server-renders the complete Dreki page as meaningful semantic HTML", async () => {
  const { contentType, html, status } = await render();

  assert.equal(status, 200);
  assert.match(contentType, /^text\/html\b/i);
  assert.match(html, /<main\b/i);

  const h1s = [
    ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi),
  ].map((match) => textContent(match[1]));
  assert.deepEqual(h1s, ["Give the repetitive work to an agent."]);

  for (const heading of [
    "Where Work Stalls",
    "What an Agent Can Own",
    "The Dreki Loop",
    "Humans Stay in Command",
    "Built in Service",
  ]) {
    assert.match(textContent(html), new RegExp(heading, "i"));
  }

  const visibleText = textContent(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<template\b[\s\S]*?<\/template>/gi, " "),
  );
  assert.ok(
    visibleText.split(/\s+/).filter(Boolean).length >= 150,
    "expected at least 150 words of server-rendered page content",
  );
});

test("renders working section, email, and telephone links", async () => {
  const { html } = await render();
  const anchorTags = tagsNamed(html, "a");
  const hrefs = anchorTags.map((tag) => attributesFor(tag).get("href"));

  assert.ok(anchorTags.length > 0, "expected the page to contain links");
  assert.ok(
    hrefs.every((href) => href && href.trim() && href.trim() !== "#"),
    "every anchor must have a non-empty destination",
  );

  for (const section of expectedSections) {
    assert.match(
      html,
      new RegExp(`\\bid=["']${section}["']`, "i"),
      `missing #${section} section`,
    );
    assert.ok(hrefs.includes(`#${section}`), `missing link to #${section}`);
  }

  const mailLinks = hrefs
    .filter((href) => /^mailto:/i.test(href))
    .map((href) => new URL(href));
  const auditEmail = mailLinks.find(
    (url) =>
      decodeURIComponent(url.pathname).toLowerCase() ===
      "brett@dreki-solutions.com",
  );

  assert.ok(auditEmail, "missing email link to Brett@dreki-solutions.com");
  assert.ok(auditEmail.searchParams.get("subject"), "email must be prefilled");
  assert.ok(auditEmail.searchParams.get("body"), "email must be prefilled");
  for (const field of [
    "Business name:",
    "Website:",
    "Workflow to optimize:",
    "Preferred contact method:",
  ]) {
    assert.match(auditEmail.searchParams.get("body"), new RegExp(field, "i"));
  }
  assert.ok(hrefs.includes("tel:+16026775926"), "missing functional phone link");

  assert.ok(
    hrefs.every((href) => !/^#audit(?:$|[/?#])/i.test(href)),
    "the page must not expose an #audit destination",
  );
  assert.doesNotMatch(html, /\bid=["']audit["']/i);
  assert.doesNotMatch(html, /<(?:form|iframe)\b/i);
});

test("publishes exact metadata, structured data, and approved brand assets", async () => {
  const { html } = await render();
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  assert.ok(titleMatch, "missing document title");
  assert.equal(textContent(titleMatch[1]), expectedTitle);

  const descriptionMeta = tagsNamed(html, "meta")
    .map(attributesFor)
    .find(
      (attributes) => attributes.get("name")?.toLowerCase() === "description",
    );
  assert.ok(descriptionMeta, "missing description metadata");
  assert.equal(descriptionMeta.get("content"), expectedDescription);

  const jsonLdDocuments = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
  ]
    .filter(
      (match) =>
        attributesFor(match[1]).get("type")?.toLowerCase() ===
        "application/ld+json",
    )
    .map((match) => JSON.parse(decodeHtml(match[2])));
  assert.ok(jsonLdDocuments.length > 0, "missing JSON-LD structured data");

  const types = schemaNodes(jsonLdDocuments).flatMap((node) =>
    Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]],
  );
  assert.ok(types.includes("Organization"), "missing Organization schema");
  assert.ok(types.includes("Service"), "missing Service schema");

  const assetMarkup = html
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/%2f/gi, "/");
  assert.match(
    assetMarkup,
    /\/brand\/dreki-logo-horizontal(?:-768)?\.(?:png|webp)/i,
  );
  assert.match(
    assetMarkup,
    /\/brand\/dreki-(?:icon-mark|icon-(?:512|1024))\.(?:png|webp)/i,
  );
});

test("keeps prohibited positioning and unsupported claims out of public HTML", async () => {
  const { html } = await render();

  for (const term of forbiddenPublicTerms) {
    assert.equal(
      html.toLowerCase().includes(term.toLowerCase()),
      false,
      `public HTML must not contain ${JSON.stringify(term)}`,
    );
  }
});

test("ships lightweight interactions without the removed intro", async () => {
  const [experience, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/DrekiExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
  ]);

  for (const expected of [
    "IntersectionObserver",
    "prefers-reduced-motion: reduce",
    "pointer: coarse",
    "saveData",
    "visibilityState",
    "cancelAnimationFrame",
  ]) {
    assert.match(
      `${experience}\n${styles}`,
      new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `missing ${expected} safeguard`,
    );
  }

  for (const removedIntroArtifact of [
    "dreki-intro",
    "Replay Intro",
    "AudioContext",
    "sessionStorage",
  ]) {
    assert.doesNotMatch(
      `${experience}\n${styles}`,
      new RegExp(removedIntroArtifact, "i"),
      `removed intro artifact remains: ${removedIntroArtifact}`,
    );
  }

  const dependencyNames = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  });
  for (const forbiddenDependency of [
    "three",
    "framer-motion",
    "drizzle-orm",
    "drizzle-kit",
  ]) {
    assert.equal(
      dependencyNames.includes(forbiddenDependency),
      false,
      `must not install ${forbiddenDependency}`,
    );
  }
});

test("ships the bespoke social card at the declared dimensions", async () => {
  const image = await readFile(new URL("../public/og.png", import.meta.url));
  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1536);
  assert.equal(image.readUInt32BE(20), 1024);
});
