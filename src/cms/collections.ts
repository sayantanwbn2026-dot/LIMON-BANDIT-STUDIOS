import { type Collection, text, area, num, image, choice, strings } from "./schema";

/**
 * Everything on this site that a person is allowed to change.
 *
 * One entry per stored document. The admin builds its navigation, its forms
 * and its validation from this file alone, so a new editable section is an
 * entry here and nothing else — no migration, no form component, no query.
 *
 * The image resolutions are the real intrinsic sizes of what is on the site
 * today, read out of the generated manifest. They are shown to the editor as
 * the size to supply, which is the difference between a merch photo that
 * lands crisp and one that ships soft because someone had a 400px crop to
 * hand and no way of knowing it was wrong.
 */

/* ------------------------------------------------------------------ *
 * GLOBAL — appears on every page
 * ------------------------------------------------------------------ */

const site: Collection = {
  key: "global.site",
  title: "Brand & contact",
  description:
    "The name, the address, the phone number. Used across the whole site and in search results.",
  group: "global",
  shape: "object",
  fields: [
    text("name", "Studio name", { required: true, help: "Shown in the logotype and page titles." }),
    text("tagline", "Tagline", { help: "One short line. Appears under the name." }),
    area("description", "Description", {
      rows: 2,
      required: true,
      help: "Used as the default search-engine description when a page has none of its own.",
    }),
    strings("address", "Address", {
      itemLabel: "Line",
      placeholder: "14B Sisir Bhaduri Sarani",
      help: "One line per row, in the order it should be read.",
    }),
    { kind: "tel", name: "phone", label: "Phone", required: true },
    { kind: "email", name: "email", label: "Email", required: true },
    text("rating", "Rating line", { help: 'Free text, e.g. "4.9/5 across 230+ sessions".' }),
    {
      kind: "url",
      name: "url",
      label: "Live website address",
      required: true,
      placeholder: "https://limonbandit.com",
      help: "The production domain. Used to build canonical links — get this wrong and search engines index the wrong URL.",
    },
    image(
      "ogImage",
      "Social share image",
      1200,
      630,
      "Shown when the site is linked on WhatsApp, Instagram or X.",
    ),
  ],
};

const social: Collection = {
  key: "global.social",
  title: "Social links",
  description: "Every profile the site links out to. Leave a field empty to hide that link.",
  group: "global",
  shape: "list",
  titleField: "platform",
  itemNoun: "link",
  fields: [
    choice("platform", "Platform", [
      "Instagram",
      "YouTube",
      "Spotify",
      "Apple Music",
      "Bandcamp",
      "SoundCloud",
      "Facebook",
      "X",
      "TikTok",
      "WhatsApp",
      "Other",
    ]),
    text("handle", "Handle", { placeholder: "@limonbandit", help: "Shown as the label." }),
    {
      kind: "url",
      name: "url",
      label: "Link",
      required: true,
      placeholder: "https://instagram.com/limonbandit",
    },
  ],
};

const nav: Collection = {
  key: "global.nav",
  title: "Navigation",
  description: "The menu. Order here is the order in the menu.",
  group: "global",
  shape: "list",
  titleField: "label",
  itemNoun: "menu item",
  fields: [
    text("label", "Label", { required: true }),
    text("to", "Links to", { required: true, mono: true, placeholder: "/rooms" }),
  ],
};

const tickers: Collection = {
  key: "global.tickers",
  title: "Ticker lines",
  description: "The scrolling strips of text. Each row is one line in the loop.",
  group: "global",
  shape: "object",
  fields: [
    strings("proofTicker", "Facts strip", { itemLabel: "Line", help: "Runs under the hero." }),
    strings("partners", "Partner names", { itemLabel: "Partner" }),
    strings("testimonialTicker", "Testimonials strip", { itemLabel: "Line" }),
    strings("ctaChecklist", "Closing checklist", { itemLabel: "Item" }),
    strings("metaChips", "Meta chips", {
      itemLabel: "Chip",
      help: 'Small bracketed facts, e.g. "Est. 2021".',
    }),
  ],
};

const seo: Collection = {
  key: "global.pages",
  title: "Page titles & SEO",
  description:
    "The heading, standfirst and search-engine text for each of the seven pages. This is what shows in Google.",
  group: "global",
  shape: "list",
  titleField: "name",
  itemNoun: "page",
  fields: [
    text("key", "Page id", {
      required: true,
      mono: true,
      help: "Do not change — the site matches on this.",
    }),
    text("index", "Chapter number", { mono: true, placeholder: "01" }),
    text("name", "Short name", { required: true, help: "Breadcrumb and menu label." }),
    text("to", "Path", { required: true, mono: true }),
    text("heading", "Page heading (H1)", { required: true }),
    {
      kind: "group",
      name: "poster",
      label: "Hero poster wordmark",
      fields: [
        text("spread", "Spread word", {
          help: "Letter-spaced across the measure. Five or six letters works best.",
        }),
        text("word", "Big word", { help: "Fitted to the same width underneath." }),
      ],
    },
    area("standfirst", "Standfirst", { rows: 2, help: "The line under the heading." }),
    text("title", "Search-engine title", {
      required: true,
      max: 65,
      help: "Aim under 60 characters.",
    }),
    area("description", "Search-engine description", {
      rows: 2,
      required: true,
      max: 165,
      help: "Aim under 155 characters.",
    }),
  ],
};

/* ------------------------------------------------------------------ *
 * HOME
 * ------------------------------------------------------------------ */

const services: Collection = {
  key: "page.home.services",
  title: "What we run",
  description: "The four operations block.",
  group: "page",
  page: "home",
  shape: "list",
  titleField: "title",
  itemNoun: "service",
  fields: [
    text("index", "Number", { mono: true, placeholder: "01" }),
    text("title", "Title", { required: true }),
    text("word", "Cover word", { help: "The single word shown over the image." }),
    area("description", "Description", { rows: 2 }),
    strings("tags", "Covers", { itemLabel: "Tag", help: 'Short items, e.g. "Live room".' }),
    image("image", "Image", 1600, 900, "Wide. Sits behind the title."),
    text("alt", "Image description", {
      help: "For screen readers and when the image fails to load.",
    }),
    text("to", "Links to", { mono: true }),
  ],
};

const doors: Collection = {
  key: "page.home.doors",
  title: "Three ways in",
  description:
    "The three doors. Colours are part of the design — change the text, leave the colours unless you know the palette.",
  group: "page",
  page: "home",
  shape: "list",
  titleField: "title",
  itemNoun: "door",
  fields: [
    text("index", "Number", { mono: true, placeholder: "/01" }),
    text("title", "Title", { required: true }),
    area("description", "Description", { rows: 3 }),
    text("cta", "Button label", { required: true }),
    text("to", "Links to", { mono: true, required: true }),
    text("surface", "Background colour", { mono: true, help: "CSS colour or var()." }),
    text("text", "Text colour", { mono: true }),
    text("muted", "Muted text colour", { mono: true }),
    text("border", "Border colour", { mono: true }),
    text("indexColor", "Number colour", { mono: true }),
  ],
};

const metrics: Collection = {
  key: "page.home.metrics",
  title: "Headline numbers",
  description: "The counting numbers. These animate up from zero as they scroll into view.",
  group: "page",
  page: "home",
  shape: "list",
  titleField: "label",
  itemNoun: "number",
  fields: [
    text("label", "Label", { required: true }),
    num("value", "Value", { required: true, step: 0.1 }),
    num("decimals", "Decimal places", { min: 0, max: 2, help: "0 for whole numbers, 1 for 4.9." }),
    text("unit", "Unit", { help: 'Appended after the number, e.g. "+" or "%".' }),
    area("sentence", "Sentence", { rows: 2, help: "The line under the number." }),
  ],
};

const wall: Collection = {
  key: "page.home.wall",
  title: "The wall",
  description: "The photo grid. A wide shot spans two columns.",
  group: "page",
  page: "home",
  shape: "list",
  titleField: "caption",
  itemNoun: "photo",
  fields: [
    image(
      "src",
      "Photo",
      1024,
      1280,
      "Portrait. Wide shots are fine if you tick 'spans two columns'.",
    ),
    text("alt", "Image description", { required: true }),
    text("caption", "Caption"),
    { kind: "boolean", name: "span", label: "Spans two columns" },
  ],
};

const testimonials: Collection = {
  key: "page.home.testimonials",
  title: "Testimonials",
  description: "What clients said, and the result they got.",
  group: "page",
  page: "home",
  shape: "list",
  titleField: "name",
  itemNoun: "testimonial",
  fields: [
    area("quote", "Quote", { rows: 3, required: true }),
    text("name", "Name", { required: true }),
    text("role", "Role", { help: 'e.g. "Vocalist, Kobra Blue".' }),
    image("photo", "Photo", 1000, 1250, "Portrait headshot."),
    strings("rooms", "Rooms used", { itemLabel: "Room" }),
    text("resultValue", "Result figure", { help: 'e.g. "3 weeks".' }),
    text("resultLabel", "Result label", { help: 'e.g. "demo to release".' }),
  ],
};

const processSteps: Collection = {
  key: "page.home.process",
  title: "How a record gets made",
  description: "The numbered steps.",
  group: "page",
  page: "home",
  shape: "list",
  titleField: "title",
  itemNoun: "step",
  fields: [
    text("index", "Number", { mono: true }),
    text("title", "Title", { required: true }),
    area("description", "Description", { rows: 3 }),
    image("thumb", "Thumbnail", 1024, 1280, "Small — shown at about 120px wide."),
    text("alt", "Image description"),
  ],
};

const faq: Collection = {
  key: "global.faq",
  title: "FAQ",
  description:
    "Every question on the site. The topic decides which page it appears on — booking questions show on Rooms, shop questions on Shop, and so on.",
  group: "global",
  shape: "list",
  titleField: "question",
  itemNoun: "question",
  fields: [
    text("question", "Question", { required: true }),
    area("answer", "Answer", { rows: 3, required: true }),
    choice("topic", "Shows on", [
      { value: "booking", label: "Rooms / booking" },
      { value: "label", label: "Label" },
      { value: "shop", label: "Shop" },
      { value: "crew", label: "Crew" },
    ]),
  ],
};

/* ------------------------------------------------------------------ *
 * ROOMS
 * ------------------------------------------------------------------ */

const rooms: Collection = {
  key: "page.rooms.rooms",
  title: "The rooms",
  description: "Each bookable room, its rate and what it holds.",
  group: "page",
  page: "rooms",
  shape: "list",
  titleField: "name",
  itemNoun: "room",
  fields: [
    text("id", "Room id", {
      required: true,
      mono: true,
      help: "Used in booking links. Avoid changing once live.",
    }),
    text("index", "Number", { mono: true }),
    text("name", "Name", { required: true }),
    text("kind", "Kind", { help: 'e.g. "Live tracking".' }),
    image("image", "Main photo", 1600, 900, "Wide hero shot of the room."),
    text("blurb", "Blurb"),
    {
      kind: "list",
      name: "specs",
      label: "Specifications",
      titleField: "k",
      itemNoun: "spec",
      fields: [text("k", "Label", { required: true }), text("v", "Value", { required: true })],
    },
    text("rate", "Rate", { required: true, help: 'Shown as written, e.g. "₹2,400 / hr".' }),
    text("capacity", "Capacity", { help: 'e.g. "6 players".' }),
    { kind: "boolean", name: "engineer", label: "Engineer included" },
    text("bestFor", "Best for"),
  ],
};

const rates: Collection = {
  key: "page.rooms.rates",
  title: "Rate cards",
  description: "The pricing plans. One can be marked as featured.",
  group: "page",
  page: "rooms",
  shape: "list",
  titleField: "plan",
  itemNoun: "plan",
  fields: [
    text("plan", "Plan name", { required: true }),
    {
      kind: "group",
      name: "hourly",
      label: "Hourly price",
      fields: [
        text("price", "Price", { required: true }),
        text("unit", "Unit", { placeholder: "/ hr" }),
      ],
    },
    {
      kind: "group",
      name: "packagePrice",
      label: "Package price",
      fields: [text("price", "Price"), text("unit", "Unit", { placeholder: "/ day" })],
    },
    text("qualifier", "Qualifier", { help: "Small print under the price." }),
    strings("features", "What's included", { itemLabel: "Feature" }),
    text("note", "Note"),
    { kind: "boolean", name: "featured", label: "Highlight this plan" },
  ],
};

/* ------------------------------------------------------------------ *
 * LABEL
 * ------------------------------------------------------------------ */

const releases: Collection = {
  key: "page.label.releases",
  title: "Releases",
  description: "The roster grid.",
  group: "page",
  page: "label",
  shape: "list",
  titleField: "title",
  itemNoun: "release",
  fields: [
    text("artist", "Artist", { required: true }),
    text("title", "Title", { required: true }),
    text("genre", "Genre"),
    text("runtime", "Runtime", { placeholder: "38 min" }),
    text("year", "Year", { placeholder: "2026" }),
    image("cover", "Cover art", 900, 900, "Square."),
    text("alt", "Image description"),
    text("span", "Grid span", {
      mono: true,
      help: "Layout hint. Leave alone unless rebuilding the grid.",
    }),
    text("height", "Grid height", { mono: true, help: "Layout hint." }),
  ],
};

const tracks: Collection = {
  key: "page.label.tracks",
  title: "Player tracks",
  description:
    "What the audio player can play. Audio files are uploaded to the site's /audio folder by a developer.",
  group: "page",
  page: "label",
  shape: "list",
  titleField: "title",
  itemNoun: "track",
  fields: [
    text("id", "Track id", { required: true, mono: true }),
    text("title", "Title", { required: true }),
    text("artist", "Artist", { required: true }),
    text("year", "Year"),
    text("genre", "Genre"),
    image("cover", "Cover art", 900, 900, "Square."),
    text("src", "Audio file", {
      mono: true,
      required: true,
      placeholder: "/audio/rusted-gold.wav",
    }),
  ],
};

const splits: Collection = {
  key: "page.label.splits",
  title: "The deal",
  description: "The 70/30 block on the label page.",
  group: "page",
  page: "label",
  shape: "list",
  titleField: "k",
  itemNoun: "term",
  fields: [
    text("k", "Label", { required: true, help: 'e.g. "Artist keeps".' }),
    text("v", "Value", { required: true, help: 'The big number, e.g. "70%".' }),
    area("d", "Description", { rows: 3 }),
  ],
};

/* ------------------------------------------------------------------ *
 * SHOP
 * ------------------------------------------------------------------ */

const products: Collection = {
  key: "commerce.products",
  title: "Products",
  description:
    "Everything for sale. Price is in whole rupees — type 1400, not ₹1,400. Stock is enforced at checkout, so a product at zero cannot be bought.",
  group: "commerce",
  shape: "list",
  titleField: "title",
  itemNoun: "product",
  fields: [
    text("id", "Product id", {
      required: true,
      mono: true,
      help: "Used in carts and past orders. Never reuse or change a live one.",
    }),
    text("index", "Catalogue number", { mono: true, placeholder: "01" }),
    text("title", "Title", { required: true }),
    text("by", "By", { required: true, help: 'Artist, or "House Merch".' }),
    choice("kind", "Kind", [
      { value: "tee", label: "Tee" },
      { value: "outerwear", label: "Outerwear" },
      { value: "cd", label: "CD" },
      { value: "vinyl", label: "Vinyl" },
      { value: "digital", label: "Digital" },
      { value: "poster", label: "Poster" },
      { value: "accessory", label: "Accessory" },
    ]),
    choice("department", "Cut for", [
      { value: "unisex", label: "Everyone" },
      { value: "men", label: "Men" },
      { value: "women", label: "Women" },
    ]),
    num("price", "Price", { required: true, min: 0, step: 1, prefix: "₹", help: "Whole rupees." }),
    num("compareAt", "Was price", {
      min: 0,
      step: 1,
      prefix: "₹",
      help: "Optional. Shown struck through beside the price.",
    }),
    image("image", "Photo", 1000, 1250, "Portrait 4:5. Shown in a two-column grid on phones."),
    area("blurb", "Blurb", { rows: 2, required: true }),
    strings("sizes", "Sizes", {
      itemLabel: "Size",
      help: "Leave empty for anything without a size run.",
    }),
    text("run", "Run size", { help: 'e.g. "150 printed".' }),
    num("stock", "Stock", {
      required: true,
      min: 0,
      step: 1,
      help: "Checkout will not sell more than this.",
    }),
    { kind: "boolean", name: "digital", label: "Digital — no shipping" },
  ],
};

const offers: Collection = {
  key: "commerce.offers",
  title: "Discount codes",
  description:
    "Codes shoppers can enter at checkout. The first one is what the flash popup hands out.",
  group: "commerce",
  shape: "list",
  titleField: "code",
  itemNoun: "code",
  fields: [
    text("code", "Code", { required: true, mono: true, placeholder: "BANDIT10" }),
    num("percent", "Percent off", { required: true, min: 1, max: 100, step: 1 }),
    text("label", "Description", { required: true, help: "Shown in the popup and on the cart." }),
    text("expires", "Expires", {
      mono: true,
      placeholder: "2026-12-31",
      help: "YYYY-MM-DD. Leave empty for no expiry.",
    }),
  ],
};

const shipping: Collection = {
  key: "commerce.shipping",
  title: "Shipping & ordering",
  description: "Delivery costs and the copy that explains them.",
  group: "commerce",
  shape: "object",
  fields: [
    num("kolkata", "Kolkata cost", { min: 0, step: 1, prefix: "₹", help: "0 for free." }),
    num("india", "Rest of India cost", { min: 0, step: 1, prefix: "₹" }),
    {
      kind: "list",
      name: "notes",
      label: "Shipping notes",
      titleField: "k",
      itemNoun: "row",
      fields: [
        text("k", "Region", { required: true }),
        text("v", "Cost label", { required: true, help: 'Free text, e.g. "Free" or "By ask".' }),
        area("d", "Explanation", { rows: 2 }),
      ],
    },
  ],
};

const drops: Collection = {
  key: "page.shop.drops",
  title: "Release rail",
  description: "The horizontal rail of releases on the home page.",
  group: "page",
  page: "shop",
  shape: "list",
  titleField: "title",
  itemNoun: "drop",
  fields: [
    text("id", "Id", { required: true, mono: true }),
    text("index", "Number", { mono: true }),
    text("title", "Title", { required: true }),
    text("artist", "Artist", { required: true }),
    text("format", "Format", { placeholder: '12" + digital' }),
    text("date", "Date", { placeholder: "Mar 2026" }),
    choice("status", "Status", ["Out now", "Pre-order", "Sold out"]),
    image("image", "Cover", 900, 900, "Square."),
    text("price", "Price", { help: "Free text — this rail is display only." }),
    text("run", "Run"),
  ],
};

/* ------------------------------------------------------------------ *
 * CREW
 * ------------------------------------------------------------------ */

const crew: Collection = {
  key: "page.crew.crew",
  title: "The crew",
  description: "Directors, engineers, artists and photographers for hire.",
  group: "page",
  page: "crew",
  shape: "list",
  titleField: "name",
  itemNoun: "person",
  fields: [
    text("id", "Id", { required: true, mono: true }),
    text("name", "Name", { required: true }),
    choice("discipline", "Discipline", ["Director", "Engineer", "Cover artist", "Photographer"]),
    text("focus", "Focus", { help: "One line on what they do." }),
    strings("credits", "Credits", { itemLabel: "Credit" }),
    text("rate", "Rate", { help: 'Free text, e.g. "₹18,000 / day".' }),
    choice("status", "Availability", ["Open", "Limited", "Booked"]),
  ],
};

/* ------------------------------------------------------------------ *
 * JOURNAL
 * ------------------------------------------------------------------ */

const posts: Collection = {
  key: "page.journal.posts",
  title: "Journal entries",
  description:
    "Articles. The body is built from blocks — each block is a paragraph, a heading, a quote or a list.",
  group: "page",
  page: "journal",
  shape: "list",
  titleField: "title",
  itemNoun: "entry",
  fields: [
    text("slug", "Web address", {
      required: true,
      mono: true,
      help: "Lowercase with hyphens. Changing this breaks existing links.",
    }),
    text("category", "Category", { required: true, help: 'e.g. "Gear", "Label", "City".' }),
    text("readTime", "Read time", { placeholder: "7 min read" }),
    text("date", "Date", { placeholder: "Feb 2026" }),
    text("title", "Title", { required: true }),
    area("standfirst", "Standfirst", { rows: 2, help: "The line under the title." }),
    image("image", "Header image", 1000, 750, "Landscape 4:3."),
    text("alt", "Image description"),
    {
      kind: "list",
      name: "body",
      label: "Body",
      titleField: "text",
      itemNoun: "block",
      fields: [
        choice("kind", "Block type", [
          { value: "p", label: "Paragraph" },
          { value: "h2", label: "Heading" },
          { value: "quote", label: "Pull quote" },
          { value: "list", label: "Bullet list" },
        ]),
        area("text", "Text", { rows: 4, help: "For a bullet list, put one item per line." }),
        text("who", "Quote attribution", { help: "Only used by pull quotes — who said it." }),
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * CONTACT
 * ------------------------------------------------------------------ */

const contact: Collection = {
  key: "page.contact.form",
  title: "Enquiry form",
  description: "The reasons someone can pick from on the contact form.",
  group: "page",
  page: "contact",
  shape: "list",
  titleField: "label",
  itemNoun: "reason",
  fields: [
    text("id", "Id", {
      required: true,
      mono: true,
      help: "Used in deep links from around the site.",
    }),
    text("label", "Label", { required: true }),
  ],
};

/* ------------------------------------------------------------------ */

export const collections: Collection[] = [
  // global
  site,
  social,
  nav,
  seo,
  tickers,
  faq,
  // home
  services,
  doors,
  metrics,
  wall,
  testimonials,
  processSteps,
  // rooms
  rooms,
  rates,
  // label
  releases,
  tracks,
  splits,
  // shop
  drops,
  // crew
  crew,
  // journal
  posts,
  // contact
  contact,
  // commerce
  products,
  offers,
  shipping,
];

export const byKey = new Map(collections.map((c) => [c.key, c]));

export function collection(key: string): Collection | undefined {
  return byKey.get(key);
}

export const globalCollections = collections.filter((c) => c.group === "global");
export const commerceCollections = collections.filter((c) => c.group === "commerce");
export const pageCollections = (page: string) =>
  collections.filter((c) => c.group === "page" && c.page === page);
