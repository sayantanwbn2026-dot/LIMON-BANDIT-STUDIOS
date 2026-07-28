import t1 from "@/assets/room-a.jpg";
import t2 from "@/assets/journal-01.jpg";
import t3 from "@/assets/journal-02.jpg";
import t4 from "@/assets/journal-03.jpg";

export type ProcessStep = {
  index: string;
  title: string;
  description: string;
  thumb: string;
  alt: string;
};

// REPLACE — how a record gets made
export const processSteps: ProcessStep[] = [
  {
    index: "[01]",
    title: "Walk in",
    description:
      "Tell us what you're making and how many nights you need. We quote in one message, not three calls.",
    thumb: t1,
    alt: "The live room set up for a tracking session",
  },
  {
    index: "[02]",
    title: "Track it",
    description:
      "The room is yours with an engineer on the clock. Rough mix lands in your inbox the same morning.",
    thumb: t2,
    alt: "Close-up of the mixing desk faders",
  },
  {
    index: "[03]",
    title: "Mix it",
    description:
      "Two revision rounds included. Master delivered as WAV and MP3 inside 72 hours of the final take.",
    thumb: t3,
    alt: "A crate of pressed vinyl records",
  },
  {
    index: "[04]",
    title: "Drop it",
    description:
      "Release through the label, print the merch, hire the crew for the video. Or take the files and go.",
    thumb: t4,
    alt: "A Kolkata street at night",
  },
];
