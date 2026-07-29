import type { ImageKey } from "@/generated/images";
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  photo: ImageKey;
  rooms: string[];
  resultValue: string;
  resultLabel: string;
};

// REPLACE — roster quotes
export const testimonials: Testimonial[] = [
  {
    quote: "We cut the whole EP in three nights and walked out with the masters.",
    name: "Rana Sen",
    role: "Rana & The Strays",
    photo: "release-01",
    rooms: ["#Room A", "#Lockout", "#Mixing"],
    resultValue: "3 nights",
    resultLabel: "#Tracked",
  },
  {
    quote: "The label actually paid out on time, which is the whole review.",
    name: "Kaalo",
    role: "Artist",
    photo: "release-02",
    rooms: ["#Label", "#Distribution"],
    resultValue: "70/30",
    resultLabel: "#Split",
  },
  {
    quote: "The merch run sold out before the single did.",
    name: "Shona R.",
    role: "DJ",
    photo: "release-06",
    rooms: ["#Drop", "#Print"],
    resultValue: "120 units",
    resultLabel: "#Sold",
  },
  {
    quote: "I hired a director off the crew page and shot the video that week.",
    name: "Neel D.",
    role: "Artist",
    photo: "release-05",
    rooms: ["#Crew", "#Video"],
    resultValue: "6 days",
    resultLabel: "#Turnaround",
  },
  {
    quote: "It's the only room in the city that doesn't rush you out at midnight.",
    name: "Mohan I.",
    role: "Producer",
    photo: "release-03",
    rooms: ["#Room B", "#Lockout"],
    resultValue: "24/7",
    resultLabel: "#Access",
  },
];
