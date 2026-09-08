import { useMemo } from "react";
import { useDoc, useList } from "./content";
import type { ImageKey } from "@/generated/images";

/**
 * The site's read API.
 *
 * One hook per collection, each returning the same shape the old
 * `src/data/*` export returned — so wiring a component to the CMS is a change
 * of import and nothing else, and a component that has not been converted
 * still compiles and still renders.
 *
 * Every one falls back to committed seed data (see `content.tsx`), so none of
 * these can return empty and take a section down with it.
 */

/* ---------------- global ---------------- */

export type SiteDoc = {
  name: string;
  tagline: string;
  description: string;
  address: string[];
  phone: string;
  email: string;
  rating: string;
  url: string;
  ogImage: string;
};

export const useSite = () => useDoc<SiteDoc>("global.site");

export type SocialLink = { platform: string; handle: string; url: string };
export const useSocial = () => useList<SocialLink>("global.social");

/**
 * One social account by platform.
 *
 * Several places print the Instagram handle inline rather than as a link, and
 * before the CMS that came from a `site.instagram` string. Social accounts
 * are a managed list now — you can add YouTube without a code change — so
 * those places look the platform up instead. Returns `null` when the editor
 * has removed it, and every caller renders nothing rather than an empty
 * bracket.
 */
export function useSocialLink(platform: string): SocialLink | null {
  const all = useSocial();
  return useMemo(
    () => all.find((s) => s.platform?.toLowerCase() === platform.toLowerCase()) ?? null,
    [all, platform],
  );
}

export type NavItem = { label: string; to: string };
export const useNavItems = () => useList<NavItem>("global.nav");

export type PageDoc = {
  key: string;
  index: string;
  name: string;
  to: string;
  heading: string;
  poster: { spread: string; word: string };
  standfirst: string;
  title: string;
  description: string;
};

export const usePages = () => useList<PageDoc>("global.pages");

/** One chapter by key. Falls back to the first page rather than undefined. */
export function usePage(key: string): PageDoc {
  const pages = usePages();
  return useMemo(() => pages.find((p) => p.key === key) ?? pages[0], [pages, key]);
}

/** The chapter before and after, wrapping at both ends. */
export function useNeighbours(key: string): { prev: PageDoc; next: PageDoc } {
  const pages = usePages();
  return useMemo(() => {
    const i = Math.max(
      0,
      pages.findIndex((p) => p.key === key),
    );
    const n = pages.length;
    return { prev: pages[(i - 1 + n) % n], next: pages[(i + 1) % n] };
  }, [pages, key]);
}

export type TickerDoc = {
  proofTicker: string[];
  partners: string[];
  testimonialTicker: string[];
  ctaChecklist: string[];
  metaChips: string[];
};

export const useTickers = () => useDoc<TickerDoc>("global.tickers");

export type FaqItem = { question: string; answer: string; topic: string };
export const useFaq = () => useList<FaqItem>("global.faq");

export function useFaqByTopic(topic: string): FaqItem[] {
  const all = useFaq();
  return useMemo(() => all.filter((f) => f.topic === topic), [all, topic]);
}

/* ---------------- home ---------------- */

export type ServiceDoc = {
  index: string;
  title: string;
  word: string;
  description: string;
  tags: string[];
  image: ImageKey | string;
  alt: string;
  to: string;
};
export const useServices = () => useList<ServiceDoc>("page.home.services");

export type DoorDoc = {
  index: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  indexColor: string;
};
export const useDoors = () => useList<DoorDoc>("page.home.doors");

export type MetricDoc = {
  label: string;
  value: number;
  decimals: number;
  unit: string;
  sentence: string;
};
export const useMetrics = () => useList<MetricDoc>("page.home.metrics");

export type WallDoc = { src: ImageKey | string; alt: string; caption: string; span?: boolean };
export const useWall = () => useList<WallDoc>("page.home.wall");

export type TestimonialDoc = {
  quote: string;
  name: string;
  role: string;
  photo: ImageKey | string;
  rooms: string[];
  resultValue: string;
  resultLabel: string;
};
export const useTestimonials = () => useList<TestimonialDoc>("page.home.testimonials");

export type ProcessDoc = {
  index: string;
  title: string;
  description: string;
  thumb: ImageKey | string;
  alt: string;
};
export const useProcess = () => useList<ProcessDoc>("page.home.process");

/* ---------------- rooms ---------------- */

export type RoomDoc = {
  id: string;
  index: string;
  name: string;
  kind: string;
  image: ImageKey | string;
  blurb: string;
  specs: { k: string; v: string }[];
  rate: string;
  capacity: string;
  engineer: boolean;
  bestFor: string;
};
export const useRooms = () => useList<RoomDoc>("page.rooms.rooms");

/**
 * A numbered step — booking a room, hiring the crew, printing a run.
 * Three sections use the same shape, so they share the type rather than
 * declaring three identical ones.
 */
export type StepDoc = { k: string; t: string; d: string };

/** Label / big value / explanation. The splits block's shape, reused. */
export type TermDoc = { k: string; v: string; d: string };

export const useRoomSteps = () => useList<StepDoc>("page.rooms.steps");

export type RateDoc = {
  plan: string;
  hourly: { price: string; unit: string };
  packagePrice: { price: string; unit: string };
  qualifier: string;
  features: string[];
  note: string;
  featured: boolean;
};
export const useRates = () => useList<RateDoc>("page.rooms.rates");

/* ---------------- label ---------------- */

export type ReleaseDoc = {
  artist: string;
  title: string;
  genre: string;
  runtime: string;
  year: string;
  cover: ImageKey | string;
  alt: string;
  span: string;
  height: string;
};
export const useReleases = () => useList<ReleaseDoc>("page.label.releases");

export type TrackDoc = {
  id: string;
  title: string;
  artist: string;
  year: string;
  genre: string;
  cover: ImageKey | string;
  src: string;
};
export const useTracks = () => useList<TrackDoc>("page.label.tracks");

export type SplitDoc = TermDoc;
export const useSplits = () => useList<SplitDoc>("page.label.splits");

/* ---------------- shop ---------------- */

export type DropDoc = {
  id: string;
  index: string;
  title: string;
  artist: string;
  format: string;
  date: string;
  status: string;
  image: ImageKey | string;
  price: string;
  run: string;
};
export const useDrops = () => useList<DropDoc>("page.shop.drops");

export const useShopRun = () => useList<TermDoc>("page.shop.run");
export const useShopStages = () => useList<StepDoc>("page.shop.stages");

export type ProductDoc = {
  id: string;
  index: string;
  title: string;
  by: string;
  kind: string;
  department: string;
  price: number;
  compareAt?: number;
  image: ImageKey | string;
  blurb: string;
  sizes?: string[];
  run: string;
  stock: number;
  digital?: boolean;
};
export const useProducts = () => useList<ProductDoc>("commerce.products");

export type OfferDoc = { code: string; percent: number; label: string; expires: string };
export const useOffers = () => useList<OfferDoc>("commerce.offers");

export type ShippingDoc = {
  kolkata: number;
  india: number;
  notes: { k: string; v: string; d: string }[];
};
export const useShipping = () => useDoc<ShippingDoc>("commerce.shipping");

/* ---------------- crew ---------------- */

export type CrewDoc = {
  id: string;
  name: string;
  discipline: string;
  focus: string;
  credits: string[];
  rate: string;
  status: string;
};
export const useCrew = () => useList<CrewDoc>("page.crew.crew");

export const useCrewSteps = () => useList<StepDoc>("page.crew.steps");
export const useCrewTerms = () => useList<TermDoc>("page.crew.terms");

/* ---------------- journal ---------------- */

export type BodyBlock = { kind: string; text: string; who?: string };
export type PostDoc = {
  slug: string;
  category: string;
  readTime: string;
  date: string;
  title: string;
  standfirst: string;
  image: ImageKey | string;
  alt: string;
  body: BodyBlock[];
};
export const usePosts = () => useList<PostDoc>("page.journal.posts");

export function usePost(slug: string): PostDoc | undefined {
  const posts = usePosts();
  return useMemo(() => posts.find((p) => p.slug === slug), [posts, slug]);
}

export type BeatDoc = { category: string; blurb: string };
export const useBeats = () => useList<BeatDoc>("page.journal.beats");

/* ---------------- contact ---------------- */

export type IntentDoc = { id: string; label: string };
export const useIntents = () => useList<IntentDoc>("page.contact.form");

export type HoursDoc = { k: string; v: string };
export const useHours = () => useList<HoursDoc>("page.contact.hours");

export type TravelDoc = { k: string; d: string };
export const useTravel = () => useList<TravelDoc>("page.contact.travel");
