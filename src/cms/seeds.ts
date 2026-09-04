import { site, navItems } from "@/data/site";
import { chapters } from "@/data/routes";
import { proofTicker, partners, testimonialTicker, ctaChecklist, metaChips } from "@/data/tickers";
import { faq } from "@/data/faq";
import { services } from "@/data/services";
import { doors } from "@/data/doors";
import { metrics } from "@/data/metrics";
import { wall } from "@/data/wall";
import { testimonials } from "@/data/testimonials";
import { processSteps } from "@/data/process";
import { rooms } from "@/data/rooms";
import { rates } from "@/data/rates";
import { releases } from "@/data/releases";
import { tracks } from "@/data/tracks";
import { crew } from "@/data/crew";
import { posts } from "@/data/journal";
import { drops } from "@/data/drops";
import { products } from "@/data/shop";
import { offers } from "@/data/offers";
import { INTENTS } from "@/lib/enquiry";

/**
 * The committed content, in CMS shape.
 *
 * Two jobs, and it is worth being clear they are the same data used twice:
 *
 *   1. The **fallback** every `useDoc` returns when the database has no row,
 *      the fetch failed, or the page is being server-rendered. This is what
 *      makes the CMS additive — with an empty database the site renders
 *      exactly as it does today.
 *   2. The **seed** pushed into `cms_documents` by `bun run cms:seed`, so an
 *      editor opens the admin and finds the real site in it rather than
 *      twenty empty forms.
 *
 * Where a field's live shape differs from the CMS shape it is converted here
 * and nowhere else. The two cases are image keys — the site's `<Picture>`
 * takes a manifest key like `"room-a"` and the CMS stores either that key or
 * an uploaded URL — and the label splits, which were hardcoded inside a
 * component rather than in a data file.
 */

export const SPLITS_SEED = [
  {
    k: "Artist keeps",
    v: "70%",
    d: "Of net receipts, on everything — streaming, sync, physical, merch tied to the record.",
  },
  {
    k: "Label takes",
    v: "30%",
    d: "Against recording, mastering, artwork, distribution and press. No recoupable extras.",
  },
  {
    k: "Paid",
    v: "Monthly",
    d: "Statements on the 5th, payment the same week. Masters revert after five years.",
  },
];

export const SHIPPING_SEED = {
  kolkata: 0,
  india: 120,
  notes: [
    { k: "Kolkata", v: "Free", d: "Collect from the building, or we drop it if we are passing." },
    { k: "India", v: "₹120", d: "Tracked, three to six days. One flat rate whatever the order." },
    {
      k: "Outside India",
      v: "By ask",
      d: "Message us first. Vinyl abroad usually costs more than the record.",
    },
  ],
};

export const SOCIAL_SEED = [
  { platform: "Instagram", handle: site.instagram, url: "https://instagram.com/limonbandit" },
];

/**
 * Journal bodies are typed blocks in the source and a flat list of
 * `{type, text}` rows in the CMS, because a non-technical editor should not
 * be editing a discriminated union. A bullet list round-trips as one string
 * with newlines.
 */
function bodyToRows(body: (typeof posts)[number]["body"]) {
  return body.map((block) => {
    switch (block.kind) {
      case "list":
        return { kind: "list", text: block.items.join("\n"), who: "" };
      case "quote":
        return { kind: "quote", text: block.text, who: block.who };
      default:
        return { kind: block.kind, text: block.text, who: "" };
    }
  });
}

export const seeds: Record<string, unknown> = {
  // ---- global ----
  "global.site": {
    name: site.name,
    tagline: site.tagline,
    description: site.description,
    address: [...site.address],
    phone: site.phone,
    email: site.email,
    rating: site.rating,
    url: site.url,
    ogImage: site.ogImage,
  },
  "global.social": SOCIAL_SEED,
  "global.nav": navItems.map((n) => ({ label: n.label, to: n.to })),
  "global.pages": chapters.map((c) => ({
    key: c.key,
    index: c.index,
    name: c.name,
    to: c.to,
    heading: c.heading,
    poster: { spread: c.poster.spread, word: c.poster.word },
    standfirst: c.standfirst,
    title: c.title,
    description: c.description,
  })),
  "global.tickers": {
    proofTicker: [...proofTicker],
    partners: [...partners],
    testimonialTicker: [...testimonialTicker],
    ctaChecklist: [...ctaChecklist],
    metaChips: [...metaChips],
  },
  "global.faq": faq.map((f) => ({ question: f.question, answer: f.answer, topic: f.topic })),

  // ---- home ----
  "page.home.services": services.map((s) => ({
    index: s.index,
    title: s.title,
    word: s.word,
    description: s.description,
    tags: [...s.tags],
    image: s.image,
    alt: s.alt,
    to: s.to,
  })),
  "page.home.doors": doors.map((d) => ({ ...d })),
  "page.home.metrics": metrics.map((m) => ({ ...m })),
  "page.home.wall": wall.map((w) => ({
    src: w.src,
    alt: w.alt,
    caption: w.caption,
    span: Boolean(w.span),
  })),
  "page.home.testimonials": testimonials.map((t) => ({
    quote: t.quote,
    name: t.name,
    role: t.role,
    photo: t.photo,
    rooms: [...t.rooms],
    resultValue: t.resultValue,
    resultLabel: t.resultLabel,
  })),
  "page.home.process": processSteps.map((p) => ({
    index: p.index,
    title: p.title,
    description: p.description,
    thumb: p.thumb,
    alt: p.alt,
  })),

  // ---- rooms ----
  "page.rooms.rooms": rooms.map((r) => ({
    id: r.id,
    index: r.index,
    name: r.name,
    kind: r.kind,
    image: r.image,
    blurb: r.blurb,
    specs: r.specs.map((s) => ({ k: s.k, v: s.v })),
    rate: r.rate,
    capacity: r.capacity,
    engineer: r.engineer,
    bestFor: r.bestFor,
  })),
  "page.rooms.rates": rates.map((r) => ({
    plan: r.plan,
    hourly: { ...r.hourly },
    packagePrice: { ...r.packagePrice },
    qualifier: r.qualifier,
    features: [...r.features],
    note: r.note,
    featured: r.featured,
  })),

  // ---- label ----
  "page.label.releases": releases.map((r) => ({ ...r })),
  "page.label.tracks": tracks.map((t) => ({ ...t })),
  "page.label.splits": SPLITS_SEED,

  // ---- shop / commerce ----
  "page.shop.drops": drops.map((d) => ({ ...d })),
  "commerce.products": products.map((p) => ({
    id: p.id,
    index: p.index,
    title: p.title,
    by: p.by,
    kind: p.kind,
    department: p.department,
    price: p.price,
    compareAt: p.compareAt ?? 0,
    image: p.image,
    blurb: p.blurb,
    sizes: p.sizes ? [...p.sizes] : [],
    run: p.run,
    stock: p.stock,
    digital: Boolean(p.digital),
  })),
  "commerce.offers": offers.map((o) => ({
    code: o.code,
    percent: o.percent,
    label: o.label,
    expires: o.expires ?? "",
  })),
  "commerce.shipping": SHIPPING_SEED,

  // ---- crew ----
  "page.crew.crew": crew.map((c) => ({
    id: c.id,
    name: c.name,
    discipline: c.discipline,
    focus: c.focus,
    credits: [...c.credits],
    rate: c.rate,
    status: c.status,
  })),

  // ---- journal ----
  "page.journal.posts": posts.map((p) => ({
    slug: p.slug,
    category: p.category,
    readTime: p.readTime,
    date: p.date,
    title: p.title,
    standfirst: p.standfirst,
    image: p.image,
    alt: p.alt,
    body: bodyToRows(p.body),
  })),

  // ---- contact ----
  "page.contact.form": INTENTS.map((i) => ({ id: i.id, label: i.label })),
};
