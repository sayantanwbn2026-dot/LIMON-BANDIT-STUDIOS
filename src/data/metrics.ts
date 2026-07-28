export type Metric = {
  label: string;
  value: number;
  decimals: number;
  unit: string;
  sentence: string;
};

// REPLACE — headline numbers
export const metrics: Metric[] = [
  {
    label: "Studio hours logged",
    value: 12,
    decimals: 0,
    unit: "k+",
    sentence: "Tracked in our rooms since the doors opened in 2021.",
  },
  {
    label: "Releases shipped",
    value: 180,
    decimals: 0,
    unit: "+",
    sentence: "Singles, EPs, and full-lengths out through the label.",
  },
  {
    label: "Streams on roster",
    value: 4.2,
    decimals: 1,
    unit: "M+",
    sentence: "Played on our own player, not counting the platforms.",
  },
  {
    label: "Avg. master turnaround",
    value: 72,
    decimals: 0,
    unit: "hrs",
    sentence: "From final take to delivered WAV, revisions included.",
  },
];
