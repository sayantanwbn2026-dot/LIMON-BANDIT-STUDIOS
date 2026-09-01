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
    /* This door sits on the opposite pole, so its type must follow that
     * pole — not --accent-text, which is pinned to black for acid. */
    surface: "var(--alt-surface)",
    text: "var(--alt-text)",
    muted: "var(--alt-mute)",
    border: "var(--alt-line)",
    indexColor: "var(--alt-text)",
  },
  {
    index: "/02",
    title: "Release it",
    description:
      "You've got a record and no machine. Sign to the label — 70/30 splits, monthly payouts, streaming on our own player.",
    cta: "Submit your demo",
    to: "/label",
    surface: "var(--accent)",
    text: "var(--accent-text)",
    muted: "rgba(8,8,8,0.65)",
    border: "rgba(8,8,8,0.25)",
    indexColor: "var(--accent-text)",
  },
  {
    index: "/03",
    title: "Run it",
    description:
      "You've got a release and no crew. Hire directors, cover artists, photographers, and engineers by the project. Print the merch while you're at it.",
    cta: "Hire the crew",
    to: "/crew",
    surface: "var(--surface-raised)",
    text: "var(--text)",
    muted: "var(--mute)",
    border: "var(--line)",
    /* --accent-type, not --accent: this is acid used as TYPE, so it has to
     * follow the pole and dim to #5F6B00 on bone. Raw --accent measured
     * 1.04:1 against --surface-raised in light mode. */
    indexColor: "var(--accent-type)",
  },
];
