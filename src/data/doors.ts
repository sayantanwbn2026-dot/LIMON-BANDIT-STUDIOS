export type Door = {
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

export const doors: Door[] = [
  {
    index: "/01",
    title: "Record it",
    description:
      "You've got songs and no room. Book by the hour, lock it overnight, and walk out with the masters. Engineer always included.",
    cta: "Book the room",
    to: "/rooms",
    surface: "var(--bone)",
    text: "var(--text-light)",
    muted: "var(--mute-light)",
    border: "var(--bone-line)",
    indexColor: "var(--text-light)",
  },
  {
    index: "/02",
    title: "Release it",
    description:
      "You've got a record and no machine. Sign to the label — 70/30 splits, monthly payouts, streaming on our own player.",
    cta: "Submit your demo",
    to: "/label",
    surface: "var(--acid)",
    text: "var(--text-light)",
    muted: "rgba(8,8,8,0.65)",
    border: "rgba(8,8,8,0.25)",
    indexColor: "var(--text-light)",
  },
  {
    index: "/03",
    title: "Run it",
    description:
      "You've got a release and no crew. Hire directors, cover artists, photographers, and engineers by the project. Print the merch while you're at it.",
    cta: "Hire the crew",
    to: "/crew",
    surface: "var(--ink-raised)",
    text: "var(--text-dark)",
    muted: "var(--mute-dark)",
    border: "var(--ink-line)",
    indexColor: "var(--acid)",
  },
];
