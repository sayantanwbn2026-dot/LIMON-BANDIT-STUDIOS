export type Rate = {
  plan: string;
  hourly: { price: string; unit: string };
  packagePrice: { price: string; unit: string };
  qualifier: string;
  features: string[];
  note: string;
  featured: boolean;
};

// REPLACE — studio rates
export const rates: Rate[] = [
  {
    plan: "The Hour",
    hourly: { price: "₹1,499", unit: "/ hr" },
    packagePrice: { price: "₹11,999", unit: "/ 10 hrs" },
    qualifier: "Min. 2 hours, engineer included",
    features: [
      "Room by the hour",
      "Engineer on the clock",
      "Backline and mics included",
      "Rough mix same day",
      "One revision round",
    ],
    note: "Best for tracking a single",
    featured: false,
  },
  {
    plan: "The Night",
    hourly: { price: "₹8,999", unit: "/ night" },
    packagePrice: { price: "₹31,999", unit: "/ 4 nights" },
    qualifier: "22:00 → 06:00, room locked to you",
    features: [
      "Room locked overnight",
      "Engineer on the clock",
      "Backline and mics included",
      "Rough mix same morning",
      "Two revision rounds",
    ],
    note: "Best for finishing an EP",
    featured: true,
  },
  {
    plan: "The Build",
    hourly: { price: "₹29,999", unit: "/ track" },
    packagePrice: { price: "₹1,09,999", unit: "/ 5 tracks" },
    qualifier: "Tracking, mix, master, delivered",
    features: [
      "Everything in The Night",
      "Mix and master included",
      "WAV and MP3 delivery",
      "Three revision rounds",
      "Release through the label",
    ],
    note: "Best for a full release",
    featured: false,
  },
];
