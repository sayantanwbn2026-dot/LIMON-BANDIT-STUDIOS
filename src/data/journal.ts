import type { ImageKey } from "@/generated/images";

/**
 * The journal, with the entries actually in it.
 *
 * Every post on the index advertised a category, a read time and a "Read
 * the entry" link that pointed at `/journal` — the page you were already
 * on. Four articles were listed and none of them existed, which is the
 * one thing a journal cannot do.
 */

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string; who: string };

export type Post = {
  /** url segment — /journal/<slug> */
  slug: string;
  category: string;
  readTime: string;
  /** ISO, for <time> and ordering */
  date: string;
  title: string;
  /** one line under the title, and the meta description */
  standfirst: string;
  image: ImageKey;
  alt: string;
  body: Block[];
};

export const posts: Post[] = [
  {
    slug: "what-sits-on-the-desk-in-room-a",
    category: "Gear",
    readTime: "7 min read",
    date: "2026-07-18",
    title: "What Actually Sits On The Desk In Room A",
    standfirst:
      "Every studio site lists gear like a menu. Here is the short version of what we own, what we borrow, and what we stopped pretending to need.",
    image: "journal-01",
    alt: "Close-up of the studio mixing console",
    body: [
      {
        kind: "p",
        text: "The console is an API 1608 with sixteen channels. We bought it second hand from a post house in Mumbai that was moving to a box and a screen, and it arrived with a dent in the meter bridge that we have never bothered to fix. It sounds like the records we grew up on, which is the only reason to own a desk that costs more than a car.",
      },
      {
        kind: "p",
        text: "Twenty-two feet of untreated brick runs down one wall. That was not a design decision, it was the building. We spent a month trying to tame it and then realised the tail on the drums was the thing people kept asking about, so we stopped.",
      },
      { kind: "h2", text: "The front end" },
      {
        kind: "p",
        text: "Most sessions never leave four microphones. A U87 for anything close, a pair of Coles 4038 over the kit, and an SM7B for the vocalists who sing quietly and then suddenly do not.",
      },
      {
        kind: "list",
        items: [
          "Neumann U87 into a 1073 — the default for vocals, and the reason most sessions finish early",
          "Coles 4038 pair — drum overheads, and brass when the horn players come in from Park Circus",
          "Shure SM7B — for the loud ones, and for anyone who hates a large diaphragm in their face",
          "1176 and LA-2A — one fast, one slow, and between them almost everything",
        ],
      },
      { kind: "h2", text: "What we stopped buying" },
      {
        kind: "p",
        text: "For two years we bought a new preamp every time a record did not sound the way we wanted. None of it worked, because the problem was never the preamp — it was the room, or the arrangement, or the fact that the take was not good yet.",
      },
      {
        kind: "quote",
        text: "The gear list is the least interesting thing about a studio. What matters is whether anyone in the room will tell you the take was not good.",
        who: "Rana, house engineer",
      },
      {
        kind: "p",
        text: "So the list stopped growing. What we spend on now is maintenance, tape, and paying the engineer properly. If you want to hear the desk, book an hour and bring a song. That will tell you more than this page can.",
      },
    ],
  },
  {
    slug: "why-we-pay-splits-monthly",
    category: "Label",
    readTime: "5 min read",
    date: "2026-06-02",
    title: "Why We Pay Splits Monthly Instead Of Quarterly",
    standfirst:
      "Quarterly accounting is the industry default. It is also the reason artists treat label money as money that may never arrive.",
    image: "journal-02",
    alt: "Records filed in a storage crate",
    body: [
      {
        kind: "p",
        text: "The standard independent deal pays out every three months, sixty days after the quarter closes. That means a stream in January is money in May. For an artist deciding whether they can afford to take a week off work to finish an EP, May is not a real number.",
      },
      { kind: "h2", text: "What it costs us" },
      {
        kind: "p",
        text: "Monthly payouts cost us roughly four hours of admin a month and a small amount of float, because the distributors still pay us on their own schedule. That is the entire downside, and we would rather carry it than ask a twenty-three year old to.",
      },
      {
        kind: "list",
        items: [
          "Splits are 70/30, artist first, on everything the label collects",
          "Paid by the tenth of the following month, into the account on file",
          "The statement lists every platform separately — no single aggregated line",
          "Masters stay with the artist; we license, we do not acquire",
        ],
      },
      { kind: "h2", text: "The part nobody advertises" },
      {
        kind: "p",
        text: "A monthly statement also means an artist notices immediately when something is wrong. Twice in the last year a release was mis-registered at the distributor and we found it in weeks rather than a quarter, because the number in the statement did not match what the artist could see on their own dashboard.",
      },
      {
        kind: "quote",
        text: "You find out fast when someone is looking at the numbers every month. That is the whole point.",
        who: "Kaalo, on the roster since 2023",
      },
      {
        kind: "p",
        text: "None of this is generous. It is just what the arrangement should have been. If you are signed somewhere that pays quarterly, ask them why — the answer is almost always that the software was set up that way in 2011.",
      },
    ],
  },
  {
    slug: "recording-in-kolkata-at-night",
    category: "City",
    readTime: "6 min read",
    date: "2026-04-27",
    title: "Recording In Kolkata When The Building Never Sleeps",
    standfirst:
      "Hatibagan does not go quiet. We built the overnight lockout around that rather than against it.",
    image: "journal-03",
    alt: "Kolkata street lit by neon at night",
    body: [
      {
        kind: "p",
        text: "The building is on Sisir Bhaduri Sarani, which is a working street. There is a sweet shop below us that starts frying at half past five in the morning, a tram line two streets over, and a wedding season that runs for months and involves brass bands at close range.",
      },
      { kind: "h2", text: "The window" },
      {
        kind: "p",
        text: "Between about eleven at night and five in the morning, the street is as close to still as it gets. Not silent — nothing here is silent — but the traffic drops to individual vehicles instead of a continuous floor, and you can track a quiet vocal without fighting a bus.",
      },
      {
        kind: "p",
        text: "That window is why the lockout exists. It is not a premium product, it is the six hours when the room is actually at its best, sold at a flat rate so nobody is watching a clock at four in the morning deciding whether one more take is worth the money.",
      },
      { kind: "h2", text: "What we did about the rest of it" },
      {
        kind: "list",
        items: [
          "Floated floor in Room B, which killed the tram rumble entirely",
          "Double glazing on the street side — the single biggest improvement we have made",
          "Nothing on the brick in Room A, deliberately",
          "A kettle, because sessions that run to five in the morning need one more than they need another compressor",
        ],
      },
      {
        kind: "quote",
        text: "People come in expecting us to apologise for the street. The street is on three of our records.",
        who: "Shona, who books the room",
      },
      {
        kind: "p",
        text: "If you want the quiet hours, book the lockout and come in at ten. If you want the sweet shop and the brass band, come at nine in the morning, and bring a microphone you do not mind pointing out of a window.",
      },
    ],
  },
  {
    slug: "how-a-print-run-gets-made",
    category: "Merch",
    readTime: "4 min read",
    date: "2026-03-11",
    title: "How A 120-Unit Print Run Actually Gets Made",
    standfirst:
      "Small runs are not a marketing position. They are what happens when you print locally and pay for the whole run up front.",
    image: "merch-tee",
    alt: "A black t-shirt hanging against a concrete wall",
    body: [
      {
        kind: "p",
        text: "A run starts with a number we can afford to be wrong about. One hundred and twenty units is roughly what we can pay a printer for in one go without borrowing, and roughly what we can store in the room above the studio without it becoming a problem.",
      },
      { kind: "h2", text: "The printer" },
      {
        kind: "p",
        text: "Everything is screen printed about four kilometres away. We looked at sending it out to a larger operation and the economics were better at three hundred units and worse at one hundred, which told us to stay where we were.",
      },
      {
        kind: "list",
        items: [
          "Blanks are picked in person — we have rejected two batches for a bad neck rib",
          "One to three colours, because each additional screen adds cost and drying time",
          "Two proofs before the run: one on the actual blank, one washed five times",
          "The run is counted on delivery, and the count is the number we publish",
        ],
      },
      { kind: "h2", text: "Why there is no restock" },
      {
        kind: "p",
        text: "Restocking means holding a screen, holding stock, and holding an inventory system, and none of those are things a studio should be spending attention on. When a run sells out, that design is finished. The next one is different.",
      },
      {
        kind: "quote",
        text: "We are not a clothing brand. We are a studio that prints a shirt when there is something worth printing on one.",
        who: "The house",
      },
      {
        kind: "p",
        text: "It also means the number on the product page is honest. When it says one hundred and twenty units, one hundred and twenty exist, and when they are gone the page says so rather than quietly reordering.",
      },
    ],
  },
];

const bySlug = new Map(posts.map((p) => [p.slug, p]));

export function post(slug: string): Post | undefined {
  return bySlug.get(slug);
}

/** The entries either side, for the footer of an article. Wraps like the chapters do. */
export function postNeighbours(slug: string): { prev: Post; next: Post } | undefined {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return undefined;
  const n = posts.length;
  return { prev: posts[(i - 1 + n) % n], next: posts[(i + 1) % n] };
}
