import j1 from "@/assets/journal-01.jpg";
import j2 from "@/assets/journal-02.jpg";
import j3 from "@/assets/journal-03.jpg";
import j4 from "@/assets/merch-tee.jpg";

export type Post = {
  category: string;
  readTime: string;
  title: string;
  image: string;
  alt: string;
};

// REPLACE — journal entries
export const posts: Post[] = [
  {
    category: "Gear",
    readTime: "7 min read",
    title: "What Actually Sits On The Desk In Room A",
    image: j1,
    alt: "Close-up of the studio mixing console",
  },
  {
    category: "Label",
    readTime: "5 min read",
    title: "Why We Pay Splits Monthly Instead Of Quarterly",
    image: j2,
    alt: "Records filed in a storage crate",
  },
  {
    category: "City",
    readTime: "6 min read",
    title: "Recording In Kolkata When The Building Never Sleeps",
    image: j3,
    alt: "Kolkata street lit by neon at night",
  },
  {
    category: "Merch",
    readTime: "4 min read",
    title: "How A 120-Unit Print Run Actually Gets Made",
    image: j4,
    alt: "A black t-shirt hanging against a concrete wall",
  },
];
