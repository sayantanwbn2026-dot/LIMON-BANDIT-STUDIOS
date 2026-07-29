import type { ImageKey } from "@/generated/images";
export type Post = {
  category: string;
  readTime: string;
  title: string;
  image: ImageKey;
  alt: string;
};

// REPLACE — journal entries
export const posts: Post[] = [
  {
    category: "Gear",
    readTime: "7 min read",
    title: "What Actually Sits On The Desk In Room A",
    image: "journal-01",
    alt: "Close-up of the studio mixing console",
  },
  {
    category: "Label",
    readTime: "5 min read",
    title: "Why We Pay Splits Monthly Instead Of Quarterly",
    image: "journal-02",
    alt: "Records filed in a storage crate",
  },
  {
    category: "City",
    readTime: "6 min read",
    title: "Recording In Kolkata When The Building Never Sleeps",
    image: "journal-03",
    alt: "Kolkata street lit by neon at night",
  },
  {
    category: "Merch",
    readTime: "4 min read",
    title: "How A 120-Unit Print Run Actually Gets Made",
    image: "merch-tee",
    alt: "A black t-shirt hanging against a concrete wall",
  },
];
