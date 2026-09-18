// REPLACE — brand + contact details
export const site = {
  name: "LIMON BANDIT",
  tagline: "Kolkata music house",
  description: "Four rooms, one label, and a merch line. Run out of a building in Kolkata.",
  address: ["14B Sisir Bhaduri Sarani", "Hatibagan, Kolkata 700006", "West Bengal, India"],
  phone: "+91 98300 00000",
  email: "room@limonbandit.com",
  instagram: "@limonbandit",
  rating: "4.9/5 ACROSS 230+ SESSIONS",
  // REPLACE — the production origin, used for canonical and og:url
  url: "https://limonbandit.com",
  /* 1200x630, generated from src/assets (room-a + the mascot) and committed
   * at public/share.jpg. Was a Lovable preview screenshot on a third-party
   * bucket, which can disappear without notice. */
  ogImage: "/share.jpg",
} as const;

export type NavItem = { label: string; to: string };

// REPLACE — navigation
export const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Rooms", to: "/rooms" },
  { label: "Label", to: "/label" },
  { label: "Shop", to: "/shop" },
  { label: "Crew", to: "/crew" },
  { label: "Journal", to: "/journal" },
  { label: "Contact", to: "/contact" },
];
