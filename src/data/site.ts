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
  ogImage:
    "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b1cedbea-3211-4616-a001-76f4d66bb912/id-preview-7ec2de84--81d10571-0622-4cc6-87cb-939b87a35638.lovable.app-1785234511091.png",
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
