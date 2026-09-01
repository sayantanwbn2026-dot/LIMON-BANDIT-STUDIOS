export type FaqTopic = "booking" | "label" | "shop" | "crew";
export type FaqItem = { question: string; answer: string; topic: FaqTopic };

// REPLACE — pre-booking questions
export const faq: FaqItem[] = [
  {
    topic: "booking",
    question: "How do I book a room?",
    answer:
      "Send us the dates and what you're recording. We confirm within a few hours and hold the slot for 48 hours without a deposit.",
  },
  {
    topic: "booking",
    question: "Do you take walk-ins?",
    answer:
      "Sometimes, late. Message the Instagram account and we'll tell you if a room is open tonight.",
  },
  {
    topic: "booking",
    question: "What happens if we overrun?",
    answer:
      "We bill to the nearest half hour and stop the clock at the Lockout rate — an overnight never costs more than the overnight price, however long it runs.",
  },
  {
    topic: "label",
    question: "How do I submit to the label?",
    answer:
      "Two finished tracks and a sentence about what you're building. We answer everyone, including the no's.",
  },
  {
    topic: "shop",
    question: "Do you ship merch outside Kolkata?",
    answer:
      "Yes, across India. Runs are small and we don't restock, so a sold-out size stays sold out.",
  },
  {
    topic: "shop",
    question: "Why don't you repress anything?",
    answer:
      "A run is priced to break even at the number we print. Repressing means holding stock we haven't sold, and that money is better spent on the next record.",
  },
  {
    topic: "shop",
    question: "Can I return a record?",
    answer:
      "If it arrives damaged or plays badly, send a photo and we replace it or refund you. We don't take returns on a change of mind — the run is too small to absorb it.",
  },
  {
    topic: "crew",
    question: "Can I hire only the crew?",
    answer: "Yes. Directors, cover artists, and engineers can be booked without recording here.",
  },
  {
    topic: "crew",
    question: "Who sets the rate?",
    answer:
      "They do. The rates on this page are theirs, we don't mark them up, and the house takes nothing from a crew booking.",
  },
  {
    topic: "crew",
    question: "What does vetted actually mean?",
    answer:
      "They have finished at least one project through this building and the artist would work with them again. That's the whole bar, and it's why the list is short.",
  },
];

export const faqByTopic = (topic: FaqTopic) => faq.filter((f) => f.topic === topic);
