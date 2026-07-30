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
    topic: "crew",
    question: "Can I hire only the crew?",
    answer: "Yes. Directors, cover artists, and engineers can be booked without recording here.",
  },
];

export const faqByTopic = (topic: FaqTopic) => faq.filter((f) => f.topic === topic);
