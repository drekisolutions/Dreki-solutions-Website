import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ORIGIN = "https://www.dreki-solutions.ai";

const routeExpectations = [
  {
    path: "/",
    title: "Agentic Systems for Service Businesses | Dreki Solutions",
    h1: "Let agents move the work. Keep people in command.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/agents",
    title: "AI Agents for Service Operations | Dreki Solutions",
    h1: "Give the repeatable work a clear owner.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/agents/customer-response",
    title: "Customer Response Agent | Dreki Solutions",
    h1: "Customer Response Agent",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/agents/intake-and-scheduling",
    title: "Intake and Scheduling Agent | Dreki Solutions",
    h1: "Intake and Scheduling Agent",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/agents/workflow-coordination",
    title: "Workflow Coordination Agent | Dreki Solutions",
    h1: "Workflow Coordination Agent",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/industries",
    title: "Agentic Systems by Industry | Dreki Solutions",
    h1: "Build around the way the work actually moves.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/industries/service-businesses",
    title: "AI Agents for Service Businesses | Dreki Solutions",
    h1: "Keep the customer journey moving while your team does the work.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/services",
    title: "Custom Agentic Software Services | Dreki Solutions",
    h1: "Turn one recurring workflow into a controlled system.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/products",
    title: "Agentic Software Product Registry | Dreki Solutions",
    h1: "See exactly where each product stands.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/portfolio",
    title: "Internal Workflow Demonstrations | Dreki Solutions",
    h1: "Inspect the operating logic before trusting the promise.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/about",
    title: "About | Dreki Solutions",
    h1: "Discipline for the work behind the work.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/engagements",
    title: "Agentic Software Engagements | Dreki Solutions",
    h1: "Scope the workflow before pricing the system.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/contact",
    title: "Contact | Dreki Solutions",
    h1: "Bring one workflow worth improving.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/book",
    title: "Book a Strategy Call | Dreki Solutions",
    h1: "Bring one workflow worth improving.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/thank-you",
    title: "Thank You | Dreki Solutions",
    h1: "Thank you for sharing the workflow.",
    indexable: false,
    socialImage: false,
  },
  {
    path: "/privacy",
    title: "Privacy Policy | Dreki Solutions",
    h1: "Privacy Policy",
    indexable: true,
    socialImage: true,
  },
];

const primaryNavigation = [
  "/agents",
  "/industries",
  "/services",
  "/products",
  "/portfolio",
];

const forbiddenPublicClaims = [
  "guaranteed results",
  "guaranteed rankings",
  "guaranteed savings",
  "trusted by",
  "proven roi",
  "customer success story",
  "customers include",
  "our clients have",
  "google partner",
  "google partnership",
  "google certified",
  "google endorsement",
  "google affiliation",
  "delivered in 30 days",
];

const retiredPublicTerms = [
  "LeadpulseAI",
  "ReviewShield",
  "SocialPulse",
  "Valkyrie 135",
  "Skyfar",
  "Declare Ready",
  "Squawk Sheet AD",
  "Trend Sentinel",
  "Rotor Log",
];

let workerPromise;
const responses = new Map();

function decodeHtml(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lt: "<",
    mdash: "—",
    middot: "·",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&([a-z]+);/gi, (entity, name) =>
      Object.hasOwn(namedEntities, name.toLowerCase())
        ? namedEntities[name.toLowerCase()]
        : entity,
    );
}

function textContent(markup) {
  return decodeHtml(markup.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
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

function articleBlocksWithClass(html, className) {
  return [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)]
    .filter((match) => {
      const attributes = attributesFor(`<article ${match[1]}>`);
      return (attributes.get("class") ?? "").split(/\s+/).includes(className);
    })
    .map((match) => match[2]);
}

function canonicalFor(path) {
  return new URL(path, `${ORIGIN}/`).toString();
}

async function fetchBuilt(path) {
  if (responses.has(path)) return responses.get(path);

  if (!workerPromise) {
    workerPromise = (async () => {
      const workerUrl = new URL("../dist/server/index.js", import.meta.url);
      workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
      return (await import(workerUrl.href)).default;
    })();
  }

  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: path.endsWith(".xml") ? "application/xml" : "*/*" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const result = {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    body: await response.text(),
  };
  responses.set(path, result);
  return result;
}

test("server-renders every published route with one specific H1 and canonical URL", async () => {
  for (const expected of routeExpectations) {
    const { status, contentType, body } = await fetchBuilt(expected.path);
    assert.equal(status, 200, `${expected.path} must return 200`);
    assert.match(contentType, /^text\/html\b/i, `${expected.path} must return HTML`);
    assert.match(body, /<main\b/i, `${expected.path} must render a main landmark`);

    const title = body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    assert.equal(textContent(title?.[1] ?? ""), expected.title);

    const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert.equal(h1s.length, 1, `${expected.path} must render exactly one H1`);
    assert.equal(textContent(h1s[0]?.[1] ?? ""), expected.h1);

    const canonicalLinks = tagsNamed(body, "link")
      .map(attributesFor)
      .filter((attributes) => attributes.get("rel") === "canonical")
      .map((attributes) => attributes.get("href"));
    assert.deepEqual(
      canonicalLinks,
      [canonicalFor(expected.path)],
      `${expected.path} must declare its production www canonical once`,
    );

    const wordCount = textContent(visibleMarkup(body)).split(/\s+/).length;
    assert.ok(
      wordCount >= 120,
      `${expected.path} needs meaningful server-rendered copy; found ${wordCount} words`,
    );
  }
});

test("keeps primary navigation focused and makes the strategy-call path available", async () => {
  for (const expected of routeExpectations) {
    const markup = visibleMarkup((await fetchBuilt(expected.path)).body);
    const hrefs = tagsNamed(markup, "a").map(
      (tag) => attributesFor(tag).get("href"),
    );

    for (const route of primaryNavigation) {
      assert.ok(hrefs.includes(route), `${expected.path} is missing ${route}`);
    }

    assert.ok(
      hrefs.includes("/contact#consultation"),
      `${expected.path} is missing the primary strategy-call action`,
    );
  }

  const homeHrefs = tagsNamed(
    visibleMarkup((await fetchBuilt("/")).body),
    "a",
  ).map((tag) => attributesFor(tag).get("href"));
  assert.equal(
    homeHrefs.includes("/terms"),
    false,
    "draft website terms must not appear in published navigation",
  );
});

test("renders exact contact details and preserves the complete governed lead form", async () => {
  const markup = visibleMarkup((await fetchBuilt("/contact")).body);
  const text = textContent(markup);
  const hrefs = tagsNamed(markup, "a").map(
    (tag) => attributesFor(tag).get("href"),
  );
  const leadFormSource = await readFile(
    new URL("../app/components/lead-form/LeadForm.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(hrefs.includes("tel:+15172157573"));
  assert.ok(hrefs.includes("mailto:brett@dreki-solutions.ai"));
  assert.match(text, /\(517\) 215-7573/);
  assert.match(text, /brett@dreki-solutions\.ai/);

  const sourceFieldNames = [
    ...tagsNamed(leadFormSource, "input"),
    ...tagsNamed(leadFormSource, "select"),
    ...tagsNamed(leadFormSource, "textarea"),
  ]
    .map((tag) => attributesFor(tag).get("name"))
    .filter(Boolean)
    .sort();
  const expectedFieldNames = [
    "areaOfInterest",
    "company",
    "contactWebsite",
    "email",
    "fullName",
    "industry",
    "marketingConsent",
    "phone",
    "processingAcknowledgment",
    "timeline",
    "workflowChallenge",
  ].sort();

  assert.deepEqual(sourceFieldNames, expectedFieldNames);
  for (const retiredField of [
    "businessName",
    "contactMethod",
    "website",
    "workflow",
  ]) {
    assert.equal(
      sourceFieldNames.includes(retiredField),
      false,
      `retired form field ${retiredField} must not return`,
    );
  }
  assert.match(
    leadFormSource,
    /\bname="contactWebsite"[\s\S]*?\btabIndex=\{-1\}/i,
  );

  if (/<form\b/i.test(markup)) {
    const renderedFieldNames = [
      ...tagsNamed(markup, "input"),
      ...tagsNamed(markup, "select"),
      ...tagsNamed(markup, "textarea"),
    ]
      .map((tag) => attributesFor(tag).get("name"))
      .filter(Boolean)
      .sort();
    assert.deepEqual(renderedFieldNames, expectedFieldNames);
    assert.match(markup, /\bname="contactWebsite"[^>]*\btabindex="-1"/i);
  } else {
    assert.match(text, /The secure online intake is not active yet\./i);
    assert.match(text, /Dreki will arrange the strategy call directly\./i);
    assert.ok(
      hrefs.includes(
        "mailto:brett@dreki-solutions.ai?subject=Strategy%20call%20request",
      ),
      "unconfigured lead capture must retain a direct request path",
    );
  }
});

test("labels all proof as internal demonstration and makes the evidence boundary explicit", async () => {
  const markup = visibleMarkup((await fetchBuilt("/portfolio")).body);
  const text = textContent(markup);
  const cards = articleBlocksWithClass(markup, "launch-demo-card");

  assert.equal(cards.length, 3);
  for (const title of ["Response Relay", "Intake Gate", "Handoff Ledger"]) {
    const card = cards.find((candidate) => textContent(candidate).includes(title));
    assert.ok(card, `missing ${title} demonstration`);
    assert.match(textContent(card), /Internal demonstration/i);
    assert.match(textContent(card), /Human gate/i);
  }

  assert.match(
    text,
    /None represents a named customer, testimonial, deployed customer system, or measured result\./i,
  );
  assert.match(text, /No customer identity or endorsement/i);
  assert.match(text, /No measured customer outcome/i);
  assert.match(text, /No guarantee of savings, speed, or revenue/i);
  assert.doesNotMatch(cards.map(textContent).join(" "), /\b\d+(?:\.\d+)?%\b/);
});

test("publishes only service-business products with a truthful status on every card", async () => {
  const markup = visibleMarkup((await fetchBuilt("/products")).body);
  const cards = articleBlocksWithClass(markup, "launch-product-card");
  const expectedProducts = new Map([
    ["Margin Hawk", "In Development"],
    ["Second Swing", "In Development"],
    ["License Retention", "In Development"],
    ["Visibility IQ", "In Development"],
    ["Bifrost", "In Development"],
    ["Asgard", "In Development"],
  ]);

  assert.equal(cards.length, expectedProducts.size);
  for (const [title, status] of expectedProducts) {
    const card = cards.find((candidate) => textContent(candidate).includes(title));
    assert.ok(card, `missing product card for ${title}`);
    assert.match(textContent(card), new RegExp(`\\b${status}\\b`, "i"));
  }

  const text = textContent(markup);
  assert.match(text, /Not generally available\. Capability and timing may change\./i);
  assert.match(text, /There is no public checkout or one-size-fits-all product price/i);
  assert.doesNotMatch(text, /\bBuy now\b|\bAdd to cart\b/i);
  assert.doesNotMatch(
    text,
    /Aviation products|Valkyrie 135|Skyfar|Declare Ready|Squawk Sheet AD|Trend Sentinel|Rotor Log/i,
  );
});

test("ships Guardian Circuit as a progressive Three.js enhancement with a complete fallback", async () => {
  const [component, client, runtime, stages, styles] = await Promise.all([
    readFile(
      new URL("../app/components/guardian-circuit/GuardianCircuit.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/components/guardian-circuit/GuardianCircuitClient.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/components/guardian-circuit/guardianCircuitRuntime.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../app/components/guardian-circuit/stages.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/components/guardian-circuit/guardian-circuit.module.css",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  const source = `${component}\n${client}\n${runtime}\n${stages}\n${styles}`;

  assert.match(client, /await import\(["']three["']\)/);
  assert.match(client, /getContext\(["']webgl2["']/);
  assert.doesNotMatch(client, /import\s+[^(\n]+\s+from\s+["']three["']/);

  for (const safeguard of [
    "prefers-reduced-motion: reduce",
    "pointer: coarse",
    "saveData",
    "document.visibilityState",
    "IntersectionObserver",
    "webglcontextlost",
    "failIfMajorPerformanceCaveat",
    "powerPreference: \"low-power\"",
  ]) {
    assert.match(
      source,
      new RegExp(safeguard.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Guardian Circuit is missing ${safeguard}`,
    );
  }

  for (const runtimeControl of [
    "MAX_BUFFER_PIXELS",
    "MAX_DPR",
    "window.devicePixelRatio",
    "ResizeObserver",
    "cancelAnimationFrame",
    "disposeScene(scene)",
    "renderer.renderLists.dispose()",
    "renderer.dispose()",
    "renderer.forceContextLoss()",
  ]) {
    assert.match(
      runtime,
      new RegExp(runtimeControl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Guardian Circuit runtime is missing ${runtimeControl}`,
    );
  }

  assert.match(component, /<GuardianCircuitClient stages=\{guardianCircuitStages\}/);
  assert.match(component, /className=\{styles\.fallback\}/);
  assert.match(styles, /\.client\[data-state="ready"\] \+ \.fallback/);
  assert.doesNotMatch(component, /<svg\b/i);

  const homeText = textContent(
    visibleMarkup((await fetchBuilt("/")).body),
  );
  for (const stage of [
    "Trigger",
    "Agent prepares",
    "Policy check",
    "Human approval",
    "System action",
    "Audit record",
  ]) {
    assert.match(homeText, new RegExp(stage, "i"), `fallback is missing ${stage}`);
  }
});

test("uses the gold palette for primary and secondary buttons", async () => {
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /--gold-bright:\s*#d8b15a;/i);
  assert.match(
    styles,
    /\.button-primary\s*\{[^}]*background:\s*var\(--gold-bright\);/is,
  );
  assert.match(
    styles,
    /\.button-secondary,\s*\.button-ghost\s*\{[^}]*border-color:\s*var\(--line-gold\);/is,
  );
  assert.match(
    styles,
    /\.header-cta\s*\{[^}]*color:\s*var\(--gold-pale\);/is,
  );
});

test("publishes only indexable routes in sitemap and protects utility paths in robots", async () => {
  const sitemap = await fetchBuilt("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.contentType, /(?:application|text)\/xml/i);

  for (const expected of routeExpectations) {
    const escapedUrl = canonicalFor(expected.path).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    if (expected.indexable) {
      assert.match(sitemap.body, new RegExp(`<loc>${escapedUrl}</loc>`));
    } else {
      assert.doesNotMatch(sitemap.body, new RegExp(`<loc>${escapedUrl}</loc>`));
    }
  }
  assert.doesNotMatch(
    sitemap.body,
    /<loc>https:\/\/www\.dreki-solutions\.ai\/terms<\/loc>/i,
  );
  assert.doesNotMatch(sitemap.body, /https:\/\/dreki-solutions\.ai/i);

  const robots = await fetchBuilt("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(robots.contentType, /^text\/plain\b/i);
  assert.match(robots.body, /^User-Agent: \*/m);
  assert.match(robots.body, /^Allow: \/$/m);
  assert.match(robots.body, /^Disallow: \/api\/$/m);
  assert.doesNotMatch(
    robots.body,
    /^Disallow: \/thank-you$/m,
    "the crawler must be able to read thank-you's noindex directive",
  );
  assert.match(
    robots.body,
    /^Sitemap: https:\/\/www\.dreki-solutions\.ai\/sitemap\.xml$/m,
  );
  assert.match(
    robots.body,
    /^Host: https:\/\/www\.dreki-solutions\.ai\/$/m,
  );

  const thankYouHtml = (await fetchBuilt("/thank-you")).body;
  const thankYouRobots = tagsNamed(thankYouHtml, "meta")
    .map(attributesFor)
    .filter((attributes) => attributes.get("name") === "robots")
    .map((attributes) => attributes.get("content")?.toLowerCase() ?? "");
  assert.ok(
    thankYouRobots.some(
      (content) => content.includes("noindex") && content.includes("nofollow"),
    ),
    "/thank-you must be noindex, nofollow",
  );

  const terms = await fetchBuilt("/terms");
  assert.equal(terms.status, 404, "draft website terms must stay unpublished");
  const termsRobots = tagsNamed(terms.body, "meta")
    .map(attributesFor)
    .filter((attributes) => attributes.get("name") === "robots")
    .map((attributes) => attributes.get("content")?.toLowerCase() ?? "");
  assert.ok(
    termsRobots.some((content) => content.includes("noindex")),
    "the hidden terms route must return a noindex 404",
  );
});

test("serves the production social card at 1200x630", async () => {
  const image = await readFile(new URL("../public/og.png", import.meta.url));
  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("references the production social card from every marketing route", async () => {
  for (const expected of routeExpectations.filter((route) => route.socialImage)) {
    const html = (await fetchBuilt(expected.path)).body;
    const metadataImages = tagsNamed(html, "meta")
      .map(attributesFor)
      .filter((attributes) =>
        ["og:image", "twitter:image"].includes(
          attributes.get("property") ?? attributes.get("name") ?? "",
        ),
      )
      .map((attributes) => attributes.get("content"));
    assert.ok(
      metadataImages.includes(`${ORIGIN}/og.png`),
      `${expected.path} must reference the production social card`,
    );
    assert.equal(
      metadataImages.some((value) => value?.includes("/og-wide.png")),
      false,
      `${expected.path} must not reference the retired social card`,
    );
  }
});

test("keeps unsupported claims and retired product names out of public copy", async () => {
  for (const expected of routeExpectations) {
    const text = textContent(
      visibleMarkup((await fetchBuilt(expected.path)).body),
    ).toLowerCase();

    for (const claim of forbiddenPublicClaims) {
      assert.equal(
        text.includes(claim),
        false,
        `${expected.path} contains unsupported public claim: ${claim}`,
      );
    }
    for (const term of retiredPublicTerms) {
      assert.equal(
        text.includes(term.toLowerCase()),
        false,
        `${expected.path} contains retired product name: ${term}`,
      );
    }
  }
});
