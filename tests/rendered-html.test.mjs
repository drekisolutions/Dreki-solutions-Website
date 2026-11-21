import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { journalTopics } from "../app/components/trades/content.ts";

const ORIGIN = "https://www.dreki-solutions.ai";

const routeExpectations = [
  {
    path: "/terms",
    title: "Terms and Conditions | Dreki Solutions",
    h1: "Terms and Conditions",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/free-audit",
    title: "Free Website & Digital Presence Audit | Dreki Solutions",
    h1: "The free audit is step 1.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/",
    title: "Social Media Marketing and Branding for Small Businesses | Dreki Solutions",
    h1: "More customers find you.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/social-media-marketing",
    title: "Social Media Marketing for Small Business | Dreki Solutions",
    h1: "Social media marketing for small businesses",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/brand-development",
    title: "Brand Development for Small Businesses | Dreki Solutions",
    h1: "Brand development for small businesses",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/about",
    title: "About | Dreki Solutions",
    h1: "Good work deserves to be found.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/contact",
    title: "Contact | Dreki Solutions",
    h1: "Tell us about your business.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/book",
    title: "Book a Call | Dreki Solutions",
    h1: "Talk through your marketing.",
    indexable: true,
    socialImage: true,
  },
  {
    path: "/thank-you",
    title: "Thank You | Dreki Solutions",
    h1: "Thank you for reaching out.",
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
  "/social-media-marketing",
  "/brand-development",
  "/#journal",
  "/about",
];

const retiredRoutes = [
  "/agents",
  "/agents/customer-response",
  "/industries",
  "/industries/service-businesses",
  "/services",
  "/products",
  "/portfolio",
  "/engagements",
  "/asgard",
  "/asgard/privacy",
  "/asgard/terms",
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
  "Valkyrie",
  "Skyfar",
  "Declare Ready",
  "Squawk Sheet AD",
  "Trend Sentinel",
  "Rotor Log",
  "HVAC",
  "food maker",
  "food-maker",
  "foodmaker",
  "Deskhand",
  "Foreman",
  "Visibility IQ",
  "Margin Hawk",
  "MarginHawk",
  "Second Swing",
  "SecondSwing",
  "License Retention",
  "Bifrost",
  "Asgard",
  "O.D.I.N",
  "ODIN",
  "RoofBid",
  "PaveOps",
  "AI receptionist",
  "sales dashboard",
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
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const result = {
    location: response.headers.get("location"),
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
    assert.match(
      contentType,
      /^text\/html\b/i,
      `${expected.path} must return HTML`,
    );
    assert.match(
      body,
      /<main\b/i,
      `${expected.path} must render a main landmark`,
    );

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

test("redirects retired agent, industry, product, and portfolio routes to the homepage", async () => {
  for (const path of retiredRoutes) {
    const { status, location } = await fetchBuilt(path);
    assert.ok([301, 308].includes(status), `${path} returned ${status}`);
    assert.equal(new URL(location, "http://localhost").pathname, "/");
  }
});

test("keeps primary navigation focused and makes the free audit the main action", async () => {
  for (const expected of routeExpectations) {
    const markup = visibleMarkup((await fetchBuilt(expected.path)).body);
    const hrefs = tagsNamed(markup, "a").map((tag) =>
      attributesFor(tag).get("href"),
    );

    for (const route of primaryNavigation) {
      assert.ok(hrefs.includes(route), `${expected.path} is missing ${route}`);
    }

    assert.ok(
      hrefs.includes("/free-audit"),
      `${expected.path} is missing the primary free-audit action`,
    );
  }

  const homeHrefs = tagsNamed(
    visibleMarkup((await fetchBuilt("/")).body),
    "a",
  ).map((tag) => attributesFor(tag).get("href"));
  assert.equal(
    homeHrefs.includes("/terms"),
    true,
    "published terms must be available from site navigation",
  );
});

test("renders exact contact details and preserves the complete governed lead form", async () => {
  const markup = visibleMarkup((await fetchBuilt("/contact")).body);
  const text = textContent(markup);
  const hrefs = tagsNamed(markup, "a").map((tag) =>
    attributesFor(tag).get("href"),
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
    assert.match(text, /Dreki will arrange the call directly\./i);
    assert.ok(
      hrefs.includes(
        "mailto:brett@dreki-solutions.ai?subject=Call%20request",
      ),
      "unconfigured lead capture must retain a direct request path",
    );
  }
});

test("renders the four offers in order, real audit fields, and honest unpublished articles", async () => {
  const markup = visibleMarkup((await fetchBuilt("/")).body);
  const text = textContent(markup);
  const serviceTitles = [
    "Digital presence audit",
    "Brand development",
    "Social media marketing",
    "Profile and site fixes",
  ];
  for (const service of serviceTitles) assert.ok(text.includes(service));
  const positions = serviceTitles.map((service) => text.indexOf(service));
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    "homepage offers must stay in audit, brand, social, fixes order",
  );
  for (const retired of [
    "Missed-call follow-up",
    "Selected work",
    "Try the inquiry demo",
  ])
    assert.equal(
      text.toLowerCase().includes(retired.toLowerCase()),
      false,
      `retired homepage section returned: ${retired}`,
    );
  assert.match(markup, /dreki-network-mark\.webp/);
  for (const name of [
    "firstName",
    "lastName",
    "email",
    "phone",
    "company",
    "city",
    "state",
    "termsAccepted",
    "smsConsent",
  ]) {
    assert.ok(
      [...tagsNamed(markup, "input"), ...tagsNamed(markup, "select")].some(
        (tag) => attributesFor(tag).get("name") === name,
      ),
      `missing audit field ${name}`,
    );
  }
  const journal = articleBlocksWithClass(markup, "forge-journal-card");
  assert.equal(journal.length, journalTopics.length);
  for (const topic of journalTopics) {
    const card = journal.find((candidate) =>
      textContent(candidate).includes(topic.title),
    );
    assert.ok(card, `missing blog card: ${topic.title}`);
    const links = tagsNamed(card, "a").map(attributesFor);
    if (topic.href) {
      assert.match(textContent(card), /Read article/);
      assert.ok(links.some((link) => link.get("href") === topic.href));
    } else {
      assert.match(textContent(card), /Coming soon/);
      assert.equal(
        links.length,
        0,
        "unpublished posts must not link to fake articles",
      );
    }
  }
  assert.ok(
    tagsNamed(markup, "a").some(
      (tag) => attributesFor(tag).get("href") === "#free-audit",
    ),
  );
});

test("uses the requested ember actions and foil styling", async () => {
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const trades = await readFile(
    new URL("../app/components/trades/trades.css", import.meta.url),
    "utf8",
  );
  assert.match(styles, /--ember:\s*#b6532b/i);
  assert.match(styles, /\.button-primary\s*\{[^}]*background:var\(--ember\)/is);
  assert.match(trades, /\.forge-foil[^}]*background-clip:\s*text/is);
  assert.match(trades, /prefers-reduced-motion:\s*reduce/);
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
  assert.match(
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
  assert.match(robots.body, /^Host: https:\/\/www\.dreki-solutions\.ai\/$/m);

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
  assert.equal(
    terms.status,
    200,
    "messaging terms must be publicly accessible",
  );
  const termsRobots = tagsNamed(terms.body, "meta")
    .map(attributesFor)
    .filter((attributes) => attributes.get("name") === "robots")
    .map((attributes) => attributes.get("content")?.toLowerCase() ?? "");
  assert.ok(
    termsRobots.every((content) => !content.includes("noindex")),
    "published terms must be indexable",
  );
});

test("serves the production social card at 1200x630", async () => {
  const image = await readFile(new URL("../public/og.png", import.meta.url));
  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("references the production social card from every marketing route", async () => {
  for (const expected of routeExpectations.filter(
    (route) => route.socialImage,
  )) {
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

test("keeps prices, setup fees, and unconfirmed platform lists off the public pages", async () => {
  for (const expected of routeExpectations) {
    const text = textContent(
      visibleMarkup((await fetchBuilt(expected.path)).body),
    );
    assert.doesNotMatch(
      text,
      /\$\s?\d/,
      `${expected.path} shows a dollar amount`,
    );
    assert.equal(
      text.toLowerCase().includes("setup fee"),
      false,
      `${expected.path} shows a setup fee`,
    );
    assert.equal(
      text.toLowerCase().includes("tiktok"),
      false,
      `${expected.path} names an unconfirmed platform`,
    );
  }

  const social = textContent(
    visibleMarkup((await fetchBuilt("/social-media-marketing")).body),
  );
  assert.match(social, /Up to 30 posts a month/);
  assert.match(social, /This plan is social content only/);
  assert.match(social, /Pricing shared after your free audit/);
  assert.match(social, /not priced here/);

  const brand = textContent(
    visibleMarkup((await fetchBuilt("/brand-development")).body),
  );
  assert.match(brand, /quoted privately/i);
  assert.match(brand, /not part of the monthly social plan/i);
});

test("fails when HVAC, food maker, or a discontinued product name returns in site source", async () => {
  const { readdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const banned =
    /\b(?:hvac|food[ -]?maker|deskhand|foreman|visibility iq|margin ?hawk|second swing|license retention|bifrost|asgard|o\.d\.i\.n\.?|odin|valkyrie|roofbid|paveops)\b|ai receptionist|sales dashboard/i;

  async function filesIn(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...(await filesIn(full)));
      else if (/\.(tsx?|css)$/.test(entry.name)) files.push(full);
    }
    return files;
  }

  const root = fileURLToPath(new URL("../app/", import.meta.url));
  const files = await filesIn(root);
  for (const file of files) {
    if (file.endsWith(`${path.sep}next.config.ts`)) continue;
    const source = await readFile(file, "utf8");
    assert.equal(
      banned.test(source),
      false,
      `${file} contains a retired product or audience term`,
    );
    assert.equal(
      /href\s*=\s*["'][^"']*(?:foreman|deskhand)/i.test(source),
      false,
      `${file} links to Foreman or Deskhand`,
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

test("audit opt-in displays disclosures and separates SMS from required policy agreement", async () => {
  const markup = visibleMarkup((await fetchBuilt("/free-audit")).body);
  const text = textContent(markup);
  for (const phrase of [
    "opt-in confirmations",
    "appointment reminders",
    "order and waitlist updates",
    "client project updates",
    "No marketing or promotional texts.",
    "Message frequency varies.",
    "Msg & data rates may apply.",
    "Reply HELP for help.",
    "Reply STOP to opt out.",
    "Consent is optional and not a condition of purchase.",
  ]) {
    assert.ok(text.includes(phrase), `Missing audit disclosure: ${phrase}`);
  }
  const inputs = tagsNamed(markup, "input").map(attributesFor);
  const sms = inputs.find((attrs) => attrs.get("name") === "smsConsent");
  const terms = inputs.find((attrs) => attrs.get("name") === "termsAccepted");
  assert.equal(sms.get("type"), "checkbox");
  assert.equal(terms.get("type"), "checkbox");
  const smsTag = tagsNamed(markup, "input").find((tag) =>
    tag.includes('name="smsConsent"'),
  );
  const termsTag = tagsNamed(markup, "input").find((tag) =>
    tag.includes('name="termsAccepted"'),
  );
  assert.doesNotMatch(smsTag, /\b(?:required|checked)(?:[\s=>])/);
  assert.match(termsTag, /\brequired(?:[\s=>])/);
  assert.doesNotMatch(termsTag, /\bchecked(?:[\s=>])/);
  for (const href of ["/terms", "/privacy"]) {
    assert.ok(
      tagsNamed(markup, "a")
        .map(attributesFor)
        .some(
          (attrs) =>
            attrs.get("href") === href && attrs.get("target") === "_blank",
        ),
    );
  }
});


test("SBA certification is visible in the shared footer and About content", async () => {
  const designation = "SBA-certified Service-Disabled Veteran-Owned Small Business (SDVOSB)";
  for (const path of ["/", "/about", "/contact"]) {
    const { status, body } = await fetchBuilt(path);
    assert.equal(status, 200);
    const footer = visibleMarkup(body).match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ?? "";
    assert.ok(textContent(footer).includes(designation), `${path} footer certification`);
    if (path === "/about") {
      const main = visibleMarkup(body).match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? "";
      assert.ok(textContent(main).includes(`Dreki Solutions LLC is an ${designation}.`));
    }
  }
});
