import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, X } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";
import { inr } from "@/lib/money";

/**
 * A RAIL OF TEES YOU CAN ACTUALLY HANDLE.
 *
 * Shirts hang side-on, turned away, the way they do in a stockroom. Brush
 * along the rail and the one under the pointer turns to face you; the ones
 * either side take the knock and swing. Drag a hanger and it slides, shoves
 * its neighbours along the bar and settles back. Press one and it lifts off
 * the rail into a full view you can spin front to back.
 *
 * WHY THE GARMENT IS A DRAWING WITH A PHOTOGRAPH INSIDE IT
 *
 * The obvious build hangs the product photo from a drawn hanger. That only
 * works for transparent cut-outs shot on one canvas at one scale, and this
 * shop has photographs — a tee on a surface, a wall, a print detail. Hung
 * straight they are rectangles dangling from a hook, which reads as a broken
 * image rather than as clothing.
 *
 * So the tee is drawn — one silhouette, its seams, its ribs, its folds — and
 * the photograph is masked INTO that silhouette as the cloth. The fold and
 * volume gradients then sit over the photo rather than under it, so what you
 * get is the real print, cut to the shape of the garment, with light on it.
 * Any photograph works, including one that was never meant for this, and the
 * CMS keeps control of what is on the rail.
 *
 * ONE GARMENT KIND, ON PURPOSE. The drawing this is adapted from carried six
 * — knit, hoodie, shirt, jacket, coat — and five of them would be three
 * hundred lines of path data that nothing on this site ever renders. The
 * rail is for tees. When the house prints a hoodie, the hoodie's paths come
 * back from that history.
 *
 * REDUCED MOTION TAKES THE PHYSICS AWAY, not the rail: everything snaps to
 * its resting place, the turn is instant, nothing swings. The rail is still
 * a rail and every garment still opens.
 */

export type RailGarment = {
  id: string;
  /** accessible name, caption, and the detail view's title */
  name: string;
  /** the maker's line — "House Merch" */
  by?: string;
  /** integer rupees; printed on the hang tag */
  price?: number;
  /** one sentence under the name */
  blurb?: string;
  /** short facts in the detail view: gsm, cut, print */
  details?: string[];
  /** the front photograph, masked into the garment */
  image?: string;
  /** the back; the front is reused when there is only one shot */
  backImage?: string;
  /** the product this is, so the detail view can link to its page */
  productId?: string;
  /** struck through on the tag when the piece is discounted */
  compareAt?: number;
  /** nothing left — the tag says so and the cloth goes grey */
  gone?: boolean;
};

/* ------------------------------------------------------------------ *
 * The drawing
 *
 * A 200 × 310 canvas, which is the proportion a tee hangs in. Every path
 * below is in that space, so the whole garment scales by one number.
 * ------------------------------------------------------------------ */

const VB_W = 200;
const VB_H = 310;
const ASPECT = VB_W / VB_H;
/** where the hook meets the bar, as a fraction of the canvas */
const HOOK_TOP = 4;
/** how far a resting garment is turned away from the viewer */
const REST = -70;
const PERSPECTIVE = 1100;
/** air between two hangers, as a fraction of the garment's height */
const GAP = 0.035;

const CREW = "M80,34 C88,45 112,45 120,34";

const TEE = {
  front: {
    body: `${CREW} C132,36 146,40 156,45 C160,48 163,52 164,57 C158,72 152,88 152,102 L153,236 C128,241 72,241 47,236 L48,102 C48,88 42,72 36,57 C37,52 40,48 44,45 C54,40 68,36 80,34 Z`,
    sleeves: [
      "M44,45 C38,47 33,50 31,55 C24,64 17,76 13,92 C18,100 24,106 30,110 C35,106 42,102 48,102 C47,84 45,62 44,45 Z",
      "M156,45 C162,47 167,50 169,55 C176,64 183,76 187,92 C182,100 176,106 170,110 C165,106 158,102 152,102 C153,84 155,62 156,45 Z",
    ],
    under: "M80,34 C90,30 110,30 120,34 C112,45 88,45 80,34 Z",
    ribs: ["M80,34 C88,45 112,45 120,34 L124,36 C114,50 86,50 76,36 Z"],
    seams: [
      "M80,34 C68,36 54,40 44,45",
      "M120,34 C132,36 146,40 156,45",
      "M48,102 C47,84 45,62 44,45",
      "M152,102 C153,84 155,62 156,45",
    ],
    stitches: [
      "M14,93 C19,101 25,106 30,109",
      "M186,93 C181,101 175,106 170,109",
      "M50,229 C74,233 126,233 150,229",
    ],
    folds: [
      "M40,56 C58,76 76,94 90,120",
      "M160,56 C142,76 124,94 110,120",
      "M70,126 C66,164 72,204 66,234",
      "M131,128 C135,164 129,204 134,234",
      "M100,112 C98,160 103,204 100,236",
      "M31,62 C27,74 23,84 21,96",
      "M169,62 C173,74 177,84 179,96",
    ],
  },
  back: {
    body: "M80,34 C90,31 110,31 120,34 C132,36 146,40 156,45 C160,48 163,52 164,57 C158,72 152,88 152,102 L153,236 C128,241 72,241 47,236 L48,102 C48,88 42,72 36,57 C37,52 40,48 44,45 C54,40 68,36 80,34 Z",
    sleeves: [
      "M44,45 C38,47 33,50 31,55 C24,64 17,76 13,92 C18,100 24,106 30,110 C35,106 42,102 48,102 C47,84 45,62 44,45 Z",
      "M156,45 C162,47 167,50 169,55 C176,64 183,76 187,92 C182,100 176,106 170,110 C165,106 158,102 152,102 C153,84 155,62 156,45 Z",
    ],
    under: undefined,
    ribs: ["M80,34 C90,31 110,31 120,34 L121,38 C110,35 90,35 79,38 Z"],
    seams: ["M80,34 C68,36 54,40 44,45", "M120,34 C132,36 146,40 156,45"],
    stitches: [
      "M14,93 C19,101 25,106 30,109",
      "M186,93 C181,101 175,106 170,109",
      "M50,229 C74,233 126,233 150,229",
    ],
    folds: [
      "M40,56 C60,74 80,88 96,104",
      "M160,56 C140,74 120,88 104,104",
      "M72,120 C68,164 74,204 68,234",
      "M128,122 C132,164 126,204 132,234",
      "M100,60 C98,150 102,200 100,236",
    ],
  },
} as const;

type Side = "front" | "back";

/** The hem a resting, side-on tee reaches, and how wide it reads turned away. */
const SIDE_HEM = 240;
const SIDE_WIDTH = 0.23;

function silhouette(side: Side): string[] {
  const art = TEE[side];
  return [art.body, ...art.sleeves];
}

/* The same outline as a CSS mask, so a photograph can be cut to the shape of
 * the garment. Built once per side and kept — it is a long data URI and the
 * rail asks for it on every paint. */
const maskCache = new Map<string, string>();
function silhouetteMask(side: Side): string {
  const cached = maskCache.get(side);
  if (cached) return cached;
  const paths = silhouette(side)
    .map((d) => `<path d='${d}'/>`)
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VB_W} ${VB_H}' preserveAspectRatio='xMidYMin meet'>${paths}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  maskCache.set(side, url);
  return url;
}

/**
 * The garment's outline as a filled shape, in SVG.
 *
 * THE RECTANGLES. The shadow under each shirt, and the shading that comes
 * over it as it turns, were both a `bg-black` div with the silhouette as a
 * CSS mask. On the rail that drew a soft grey rectangle the size of the whole
 * garment box behind every piece — the mask resolved, but the element being
 * masked is also the element the rail writes a transform to every frame, and
 * a transformed, blurred, masked box composites as the box rather than as the
 * mask.
 *
 * Drawing the silhouette instead of masking a rectangle with it removes the
 * failure rather than tuning it: there is no rectangle in the layer any more,
 * so no rectangle can survive. Same paths and the same `xMidYMin meet` as
 * every other layer, so it lands in register with the cloth.
 */
function Silhouette({
  side,
  blur,
  className,
  style,
  innerRef,
}: {
  side: Side;
  /** px of Gaussian blur — the shadow is soft, the shading is not */
  blur?: number;
  className?: string;
  style?: React.CSSProperties;
  innerRef?: (node: SVGSVGElement | null) => void;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      ref={innerRef}
      aria-hidden="true"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMin meet"
      className={className}
      style={style}
    >
      {blur ? (
        <defs>
          <filter id={`${id}-b`} x="-25%" y="-15%" width="150%" height="130%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
      ) : null}
      <g filter={blur ? `url(#${id}-b)` : undefined}>
        {silhouette(side).map((d) => (
          <path key={d} d={d} fill="black" />
        ))}
      </g>
    </svg>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Light falling on a turning surface. 1 face-on, down to 0.66 edge-on. */
function lambert(angle: number) {
  const r = (angle * Math.PI) / 180;
  return 0.66 + 0.34 * Math.max(0, Math.sin(r) * 0.42 + Math.cos(r) * 0.91);
}

/** How much room a garment takes on the bar at this angle. */
function footprint(h: number, angle: number) {
  const e = clamp(1 - angle / REST, 0, 1);
  const ease = e * e * (3 - 2 * e);
  return h * ASPECT * (SIDE_WIDTH + (0.94 - SIDE_WIDTH) * ease);
}

/* ------------------------------------------------------------------ *
 * The painted parts
 * ------------------------------------------------------------------ */

function Defs({ uid }: { uid: string }) {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute" focusable="false">
      <defs>
        {(["front", "back"] as const).map((side) => (
          <clipPath key={side} id={`${uid}-clip-${side}`}>
            {silhouette(side).map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
        ))}
        {/* The edge-on garment needs one too, and not having it is what put a
            grey rectangle behind every resting shirt: the side volume is a
            full-canvas <rect> filled with a gradient, and a gradient rect
            outside a clip is just a rectangle. */}
        <clipPath id={`${uid}-clip-side`}>
          <path d={SIDE_BODY} />
          <path d={SIDE_SLEEVE} />
        </clipPath>
        {/* Across the garment: dark at both edges where the cloth turns away,
            barely lifted through the middle. This is what stops a flat fill
            reading as paper. */}
        <linearGradient id={`${uid}-volume`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="black" stopOpacity="0.4" />
          <stop offset="0.16" stopColor="black" stopOpacity="0.12" />
          <stop offset="0.45" stopColor="white" stopOpacity="0.06" />
          <stop offset="0.84" stopColor="black" stopOpacity="0.14" />
          <stop offset="1" stopColor="black" stopOpacity="0.44" />
        </linearGradient>
        {/* Down it: light on the shoulders, weight in the hem. */}
        <linearGradient id={`${uid}-drape`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.14" />
          <stop offset="0.24" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.26" />
        </linearGradient>
        <linearGradient
          id={`${uid}-sidevol`}
          gradientUnits="userSpaceOnUse"
          x1="80"
          x2="120"
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor="white" stopOpacity="0.12" />
          <stop offset="0.7" stopColor="black" stopOpacity="0.1" />
          <stop offset="1" stopColor="black" stopOpacity="0.34" />
        </linearGradient>
        {/* The hanger. Matte steel, because this is a stockroom and not a
            boutique — and because chrome on a black ground is a glare. */}
        <linearGradient
          id={`${uid}-steel`}
          gradientUnits="userSpaceOnUse"
          x1="98.5"
          x2="101.7"
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor="color-mix(in oklab, var(--line-strong) 70%, white)" />
          <stop offset="0.4" stopColor="color-mix(in oklab, var(--line-strong) 40%, white)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--line-strong) 80%, black)" />
        </linearGradient>
        <pattern id={`${uid}-rib`} width="2.6" height="8" patternUnits="userSpaceOnUse">
          <rect width="1.1" height="8" fill="black" fillOpacity="0.22" />
          <rect x="1.3" width="0.7" height="8" fill="white" fillOpacity="0.07" />
        </pattern>
        <filter id={`${uid}-soft`} x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
    </svg>
  );
}

const HOOK = "M100,36 L100,-0.4 C100,-3.4 102.2,-4.2 103.9,-2.8 C104.9,-2 105.4,-1.2 105.6,-0.2";
const BAR = "M38,57 Q70,38 100,36 Q130,38 162,57";

function Hook({ uid }: { uid: string }) {
  return (
    <>
      <path
        d={HOOK}
        fill="none"
        stroke="black"
        strokeOpacity="0.5"
        strokeWidth="3.4"
        strokeLinecap="round"
        transform="translate(0.9 1.1)"
      />
      <path
        d={HOOK}
        fill="none"
        stroke={`url(#${uid}-steel)`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* The one piece of acid on the garment: the bend of the hook catching
          the room light. It is the house's accent doing what it does
          everywhere else — marking the one place your eye should land. */}
      <path
        d="M99.6,10 L99.6,-0.2 C99.6,-2.4 101,-3.2 102.4,-2.6"
        fill="none"
        stroke="var(--accent)"
        strokeOpacity="0.85"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <rect x="96.4" y="27" width="7.2" height="9" rx="1.6" fill={`url(#${uid}-steel)`} />
    </>
  );
}

function Hanger({ uid, side }: { uid: string; side: Side }) {
  const art = TEE[side];
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMin meet"
      className="absolute inset-0 size-full overflow-visible"
    >
      {art.under ? <path d={art.under} fill="var(--surface-deep)" /> : null}
      <path
        d={BAR}
        fill="none"
        stroke="black"
        strokeOpacity="0.45"
        strokeWidth="9.5"
        strokeLinecap="round"
        transform="translate(0.6 1.6)"
      />
      <path
        d={BAR}
        fill="none"
        stroke={`url(#${uid}-steel)`}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M40,54.5 Q71,35.5 100,33.5 Q129,35.5 160,54.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <Hook uid={uid} />
    </svg>
  );
}

function SideHanger({ uid }: { uid: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMin meet"
      className="absolute inset-0 size-full overflow-visible"
    >
      <path d="M97.8,35 L102.2,35 L104.5,50 L95.5,50 Z" fill={`url(#${uid}-steel)`} />
      <Hook uid={uid} />
    </svg>
  );
}

/**
 * The cloth: the photograph cut to the garment, with the garment's own
 * light over it. When there is no photograph the fill is the house's
 * raised surface, which hangs as a plain house tee.
 */
function Cloth({
  uid,
  side,
  image,
  gone,
}: {
  uid: string;
  side: Side;
  image?: string;
  gone?: boolean;
}) {
  const art = TEE[side];
  const clip = `url(#${uid}-clip-${side})`;
  const mask = `${silhouetteMask(side)} top center / contain no-repeat`;

  return (
    <span className="absolute inset-0">
      {/* The photograph, masked. Outside the SVG so the browser decodes it as
          an ordinary image — an <image> inside SVG is not eligible for the
          same lazy loading or the same cache. */}
      {image ? (
        <span
          aria-hidden="true"
          /* No background colour under the photograph: the mask clips what this
             element paints, so a colour here is only ever seen if the mask
             fails — and then it is seen as a full grey rectangle, which is
             exactly the bug this component already had once. */
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitMask: mask,
            mask: mask,
            filter: gone ? "grayscale(1) brightness(0.72)" : undefined,
          }}
        />
      ) : null}

      <svg
        aria-hidden="true"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMin meet"
        className="absolute inset-0 size-full overflow-visible"
      >
        {!image ? (
          <>
            <path d={art.body} fill="var(--surface-raised)" />
            {art.sleeves.map((d) => (
              <path key={d} d={d} fill="var(--surface-raised)" />
            ))}
          </>
        ) : null}

        <g clipPath={clip}>
          {art.ribs.map((d) => (
            <path key={`${d}-r`} d={d} fill={`url(#${uid}-rib)`} />
          ))}
          <g filter={`url(#${uid}-soft)`} fill="none" strokeLinecap="round">
            {art.folds.map((d) => (
              <path key={d} d={d} stroke="black" strokeOpacity="0.26" strokeWidth="4" />
            ))}
            {art.folds.map((d) => (
              <path
                key={`${d}-hi`}
                d={d}
                stroke="white"
                strokeOpacity="0.09"
                strokeWidth="2"
                transform="translate(2.2 0)"
              />
            ))}
            {art.sleeves.map((d) => (
              <path key={`${d}-edge`} d={d} stroke="black" strokeOpacity="0.22" strokeWidth="3" />
            ))}
          </g>
          <rect width={VB_W} height={VB_H} fill={`url(#${uid}-volume)`} />
          <rect width={VB_W} height={VB_H} fill={`url(#${uid}-drape)`} />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {art.seams.map((d) => (
            <path key={d} d={d} stroke="black" strokeOpacity="0.3" strokeWidth="0.8" />
          ))}
          {art.stitches.map((d) => (
            <path
              key={d}
              d={d}
              stroke="white"
              strokeOpacity="0.28"
              strokeWidth="0.6"
              strokeDasharray="1.6 1.4"
            />
          ))}
        </g>
      </svg>
    </span>
  );
}

const SIDE_CUFF = 104;
const SIDE_BODY = `M86,60 C85,96 88,132 85,168 C83,196 84,${SIDE_HEM - 18} 85,${SIDE_HEM} C92,${SIDE_HEM + 5} 109,${SIDE_HEM + 5} 116,${SIDE_HEM} C117,${SIDE_HEM - 18} 118,196 116,168 C113,132 116,96 114,60 Z`;
const SIDE_SLEEVE = `M84,56 C84,47 90,43 100,43 C110,43 116,47 116,56 C117,64 119,${SIDE_CUFF - 14} 119,${SIDE_CUFF - 2} C119,${SIDE_CUFF + 4} 116,${SIDE_CUFF + 7} 111,${SIDE_CUFF + 7} C100,${SIDE_CUFF + 8} 90,${SIDE_CUFF + 6} 83,${SIDE_CUFF + 2} C80,${SIDE_CUFF - 1} 80,${SIDE_CUFF - 6} 81,${SIDE_CUFF - 10} C83,${SIDE_CUFF - 24} 83,70 84,56 Z`;

/**
 * The resting garment carries its own photograph too.
 *
 * Without this every tee on the rail is the same mid-grey column until you
 * turn one, so a rail of three reads as three identical pipes and a rail of
 * ten reads as a fence. Masked edge-on the photo is a 40px strip of the
 * print — not legible, which is right: it is a colour and a texture telling
 * you these are different shirts, and the reason to turn one.
 */
const sideMaskCache = { url: "" };
function sideMask(): string {
  if (!sideMaskCache.url) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VB_W} ${VB_H}' preserveAspectRatio='xMidYMin meet'><path d='${SIDE_BODY}'/><path d='${SIDE_SLEEVE}'/></svg>`;
    sideMaskCache.url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  return sideMaskCache.url;
}

/** The same tee seen edge-on, which is how it rests on the bar. */
function SideCloth({ uid, image, gone }: { uid: string; image?: string; gone?: boolean }) {
  const hem = SIDE_HEM;
  const cuff = SIDE_CUFF;
  const body = SIDE_BODY;
  const sleeve = SIDE_SLEEVE;
  const mask = `${sideMask()} top center / contain no-repeat`;
  return (
    <>
      {image ? (
        <span
          aria-hidden="true"
          /* No background colour under the photograph: the mask clips what this
             element paints, so a colour here is only ever seen if the mask
             fails — and then it is seen as a full grey rectangle, which is
             exactly the bug this component already had once. */
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${image}")`,
            /* Zoomed and pushed to one side: an edge-on garment shows the
             * side seam of the print, not the middle of it. */
            backgroundSize: "260% auto",
            backgroundPosition: "38% center",
            WebkitMask: mask,
            mask: mask,
            filter: gone ? "grayscale(1) brightness(0.72)" : undefined,
          }}
        />
      ) : null}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMin meet"
        className="absolute inset-0 size-full overflow-visible"
      >
        {!image ? (
          <>
            <path d={body} fill="var(--surface-raised)" />
            <path d={sleeve} fill="var(--surface-raised)" />
          </>
        ) : null}
        <g clipPath={`url(#${uid}-clip-side)`}>
          <g fill="none" strokeLinecap="round" filter={`url(#${uid}-soft)`}>
            <path
              d={`M90,${cuff + 10} C87,150 92,190 88,${hem - 4}`}
              stroke="black"
              strokeOpacity="0.3"
              strokeWidth="2.6"
            />
            <path
              d={`M106,${cuff + 6} C109,140 104,186 108,${hem - 2}`}
              stroke="black"
              strokeOpacity="0.2"
              strokeWidth="2.2"
            />
            <path
              d={`M80,${cuff + 6} C90,${cuff + 12} 110,${cuff + 12} 120,${cuff + 7}`}
              stroke="black"
              strokeOpacity="0.45"
              strokeWidth="6"
            />
            <path
              d={`M84,${hem + 1} C92,${hem + 6} 108,${hem + 6} 116,${hem + 1}`}
              stroke="black"
              strokeOpacity="0.38"
              strokeWidth="6"
            />
          </g>
          <rect
            width={VB_W}
            height={VB_H}
            fill={`url(#${uid}-sidevol)`}
            style={{ mixBlendMode: "multiply" }}
          />
        </g>
        <ellipse cx="100" cy="46" rx="9" ry="3" fill={`url(#${uid}-rib)`} />
        <ellipse
          cx="100"
          cy="46"
          rx="9"
          ry="3"
          fill="none"
          stroke="black"
          strokeOpacity="0.3"
          strokeWidth="0.6"
        />
      </svg>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The physics
 *
 * One rAF loop for the whole rail, writing transforms straight to the
 * elements. Four springs per garment — where it is on the bar, how far it
 * is turned, how it swings under the hook, and how the hang tag trails
 * that swing — plus two relaxation passes that stop two garments
 * occupying the same stretch of bar.
 *
 * State lives in a ref and never in React: this runs at 60fps and a
 * re-render per frame for a row of shirts is the wrong trade.
 * ------------------------------------------------------------------ */

type Sim = {
  x: number[];
  vx: number[];
  tx: number[];
  turn: number[];
  vturn: number[];
  tturn: number[];
  swing: number[];
  vswing: number[];
  tag: number[];
  vtag: number[];
  drag: number;
  grab: number;
  free: number;
  last: number;
  raf: number;
};

function emptySim(): Sim {
  return {
    x: [],
    vx: [],
    tx: [],
    turn: [],
    vturn: [],
    tturn: [],
    swing: [],
    vswing: [],
    tag: [],
    vtag: [],
    drag: -1,
    grab: 0,
    free: 0,
    last: 0,
    raf: 0,
  };
}

export type GarmentRailProps = {
  items: RailGarment[];
  /** turns each piece to the front in turn until the visitor takes over */
  autoplay?: boolean;
  /** ms each piece faces front during autoplay */
  interval?: number;
  /** said under the rail while nothing is turned */
  caption?: string;
  /** the words on the detail view's controls */
  labels?: { front: string; back: string; close: string; show: string; see: string };
};

const DEFAULT_LABELS = {
  front: "Front",
  back: "Back",
  close: "Close",
  show: "Show",
  see: "See the piece",
};

/** Below this the rail becomes one garment at a time with a swipe. */
const MIN_RAIL_H = 230;
const MAX_H = 420;
const PHONE_H = 330;

export function GarmentRail({
  items,
  autoplay = false,
  interval = 3200,
  caption,
  labels = DEFAULT_LABELS,
}: GarmentRailProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const count = items.length;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const slots = useRef<(HTMLButtonElement | null)[]>([]);
  const swings = useRef<(HTMLSpanElement | null)[]>([]);
  const turns = useRef<(HTMLSpanElement | null)[]>([]);
  const sides = useRef<(HTMLSpanElement | null)[]>([]);
  const shades = useRef<(SVGSVGElement | null)[]>([]);
  const shadows = useRef<(SVGSVGElement | null)[]>([]);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const sim = useRef(emptySim());

  const [size, setSize] = useState({ width: 0, h: 300, carousel: false });
  const [active, setActive] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(autoplay);
  const returnFocus = useRef<number | null>(null);
  const pendingOpen = useRef(-1);
  const pointer = useRef({
    id: -1,
    index: -1,
    x: 0,
    y: 0,
    moved: false,
    kind: "",
    swipe: 0,
    lastX: 0,
    lastT: 0,
    v: 0,
  });

  /* What the loop needs to read without being re-created every render. */
  const live = useRef({
    active: null as number | null,
    size,
    reduced,
    count,
    openIndex: null as number | null,
    carouselIndex: 0,
  });
  live.current = { ...live.current, active, size, reduced, count, openIndex };

  const carouselIndex = size.carousel ? (active ?? live.current.carouselIndex) : null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches || prefersReducedMotion());
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => setPlaying(autoplay), [autoplay]);

  /* How tall a garment can be: the width divided between one garment turned
   * to the front and the rest resting side-on. Under MIN_RAIL_H that
   * arithmetic stops producing a rail anyone can use, and the whole thing
   * becomes one garment at a time — which is the right answer on a phone
   * rather than a worse version of the same row. */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = (width: number) => {
      const restK = footprint(1, REST) + GAP;
      const activeK = footprint(1, 0) + GAP;
      const fit = (width - 24) / (count * restK + (activeK - restK));
      const carousel = fit < MIN_RAIL_H;
      const h = carousel ? Math.min(PHONE_H, Math.max(210, width * 0.92)) : Math.min(MAX_H, fit);
      setSize((old) =>
        Math.abs(old.width - width) < 0.5 && old.carousel === carousel && Math.abs(old.h - h) < 0.5
          ? old
          : { width, h: Math.round(h), carousel },
      );
    };
    measure(stage.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const box = entries[0];
      if (box) measure(box.contentRect.width);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [count]);

  const targets = useCallback(
    (h: number, width: number, carousel: boolean, front: number | null) => {
      const feet = items.map((_, i) => footprint(h, i === front ? 0 : REST) + h * GAP);
      if (carousel) {
        const centre = front ?? 0;
        const xs = feet.map(() => 0);
        xs[centre] = width / 2;
        for (let i = centre + 1; i < feet.length; i++)
          xs[i] = (xs[i - 1] ?? 0) + ((feet[i - 1] ?? 0) + (feet[i] ?? 0)) / 2;
        for (let i = centre - 1; i >= 0; i--)
          xs[i] = (xs[i + 1] ?? 0) - ((feet[i + 1] ?? 0) + (feet[i] ?? 0)) / 2;
        return xs;
      }
      /* SPREAD, DON'T PACK, WHEN THERE IS ROOM.
       *
       * Packed shoulder to shoulder is right for a rail with twenty shirts
       * on it and wrong for one with three: measured at 1440px, three tees
       * occupied 231px of it and the other 1200 read as a mistake rather
       * than as space. A real rail with three shirts on it has them spread
       * out too, so this is the honest arrangement as well as the better
       * looking one.
       *
       * The extra air is capped at one garment width, which is the point
       * past which they stop reading as one rail and start reading as
       * three separate things hanging in a row. */
      const total = feet.reduce((sum, f) => sum + f, 0);
      const room = width * 0.82 - total;
      const air =
        feet.length > 1 ? clamp(room / (feet.length - 1), 0, footprint(h, REST) * 2.4) : 0;
      const spread = total + air * (feet.length - 1);
      let cursor = (width - spread) / 2;
      return feet.map((f) => {
        const x = cursor + f / 2;
        cursor += f + air;
        return x;
      });
    },
    [items],
  );

  const paint = useCallback((i: number) => {
    const s = sim.current;
    const { h } = live.current.size;
    const w = h * ASPECT;
    const slot = slots.current[i];
    if (!slot) return;
    const angle = s.turn[i] ?? REST;
    slot.style.transform = `translate3d(${((s.x[i] ?? 0) - w / 2).toFixed(2)}px,0,0)`;

    const sw = swings.current[i];
    if (sw) sw.style.transform = `rotate(${(s.swing[i] ?? 0).toFixed(3)}deg)`;

    /* The crossover between the side-on view and the turning one. Both are
     * real drawings of the same garment, so the swap has to happen while
     * the thing is nearly edge-on and neither is readable. */
    const e = clamp(1 - angle / REST, 0, 1);
    const tu = turns.current[i];
    const sd = sides.current[i];
    if (tu) {
      tu.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg)`;
      tu.style.opacity = clamp((e - 0.44) / 0.12, 0, 1).toFixed(3);
    }
    if (sd) {
      sd.style.opacity = clamp((0.56 - e) / 0.12, 0, 1).toFixed(3);
      sd.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${(Math.min(1, e * 2) * -84).toFixed(2)}deg)`;
    }
    const sh = shades.current[i];
    if (sh) sh.style.setProperty("--shade", (1 - lambert(angle)).toFixed(3));
    const shadow = shadows.current[i];
    if (shadow) {
      shadow.style.transform = `translate3d(${(w * 0.05).toFixed(1)}px, ${(h * 0.03).toFixed(1)}px, 0) scaleX(${Math.max(0.12, Math.abs(Math.cos((angle * Math.PI) / 180))).toFixed(3)})`;
    }
    const tag = tags.current[i];
    if (tag) tag.style.transform = `rotate(${(-11 + (s.tag[i] ?? 0)).toFixed(2)}deg)`;
  }, []);

  const step = useCallback(
    (now: number) => {
      const s = sim.current;
      const n = live.current.count;
      const dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 1 / 60;
      s.last = now;
      const { h, width, carousel } = live.current.size;
      let busy = false;
      const sub = 2;
      const sdt = dt / sub;

      for (let k = 0; k < sub; k++) {
        for (let i = 0; i < n; i++) {
          const before = s.vx[i] ?? 0;
          if (i !== s.drag) {
            const restoring = now > s.free;
            const stiff = restoring ? 130 : 0;
            const damp = restoring ? 2 * Math.sqrt(130) * 0.86 : 3.2;
            const ax = -stiff * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - damp * before;
            s.vx[i] = before + ax * sdt;
            s.x[i] = (s.x[i] ?? 0) + (s.vx[i] ?? 0) * sdt;
          }
          const accel = ((s.vx[i] ?? 0) - before) / sdt;

          const ta =
            -150 * ((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) -
            2 * Math.sqrt(150) * 0.78 * (s.vturn[i] ?? 0);
          s.vturn[i] = (s.vturn[i] ?? 0) + ta * sdt;
          s.turn[i] = (s.turn[i] ?? 0) + (s.vturn[i] ?? 0) * sdt;

          /* The swing is driven by the garment's own acceleration along the
           * bar, which is what makes a shove feel like weight rather than
           * like an animation that happens to play. */
          const sa =
            -24 * (s.swing[i] ?? 0) - 2.1 * (s.vswing[i] ?? 0) - clamp(accel, -6000, 6000) * 0.0045;
          s.vswing[i] = (s.vswing[i] ?? 0) + sa * sdt;
          s.swing[i] = clamp((s.swing[i] ?? 0) + (s.vswing[i] ?? 0) * sdt, -12, 12);

          const tagA =
            -46 * ((s.tag[i] ?? 0) - (s.swing[i] ?? 0) * 0.6) -
            3.4 * (s.vtag[i] ?? 0) -
            (s.vswing[i] ?? 0) * 0.9;
          s.vtag[i] = (s.vtag[i] ?? 0) + tagA * sdt;
          s.tag[i] = clamp((s.tag[i] ?? 0) + (s.vtag[i] ?? 0) * sdt, -30, 30);
        }

        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < n - 1; i++) {
            const a = s.x[i] ?? 0;
            const b = s.x[i + 1] ?? 0;
            const minGap =
              (footprint(h, s.turn[i] ?? REST) + footprint(h, s.turn[i + 1] ?? REST)) / 2 +
              h * 0.012;
            const overlap = minGap - (b - a);
            if (overlap <= 0) continue;
            if (i === s.drag) s.x[i + 1] = b + overlap;
            else if (i + 1 === s.drag) s.x[i] = a - overlap;
            else {
              s.x[i] = a - overlap / 2;
              s.x[i + 1] = b + overlap / 2;
            }
            const va = s.vx[i] ?? 0;
            const vb = s.vx[i + 1] ?? 0;
            if (va > vb) {
              const shared = (va + vb) / 2;
              if (i !== s.drag) s.vx[i] = shared;
              if (i + 1 !== s.drag) s.vx[i + 1] = shared;
            }
          }
        }

        if (!carousel && n > 0) {
          const edge = h * 0.06;
          const first = edge + footprint(h, s.turn[0] ?? REST) / 2;
          const last = width - edge - footprint(h, s.turn[n - 1] ?? REST) / 2;
          if ((s.x[0] ?? 0) < first) {
            s.x[0] = first;
            s.vx[0] = Math.abs(s.vx[0] ?? 0) * 0.3;
          }
          if ((s.x[n - 1] ?? 0) > last) {
            s.x[n - 1] = last;
            s.vx[n - 1] = -Math.abs(s.vx[n - 1] ?? 0) * 0.3;
          }
        }
      }

      for (let i = 0; i < n; i++) {
        paint(i);
        if (
          Math.abs(s.vx[i] ?? 0) > 0.4 ||
          (now > s.free && Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.25) ||
          Math.abs((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) > 0.05 ||
          Math.abs(s.vturn[i] ?? 0) > 0.05 ||
          Math.abs(s.swing[i] ?? 0) > 0.02 ||
          Math.abs(s.vswing[i] ?? 0) > 0.05 ||
          Math.abs(s.tag[i] ?? 0) > 0.05 ||
          Math.abs(s.vtag[i] ?? 0) > 0.08
        ) {
          busy = true;
        }
      }
      if (s.drag >= 0 || now < s.free) busy = true;

      if (busy) s.raf = requestAnimationFrame(step);
      else {
        s.raf = 0;
        s.last = 0;
        for (let i = 0; i < n; i++) {
          if (now > s.free) s.x[i] = s.tx[i] ?? 0;
          s.swing[i] = 0;
          s.vswing[i] = 0;
          s.tag[i] = 0;
          s.vtag[i] = 0;
          paint(i);
        }
      }
    },
    [paint],
  );

  const kick = useCallback(() => {
    const s = sim.current;
    if (live.current.reduced) {
      for (let i = 0; i < live.current.count; i++) {
        s.x[i] = s.tx[i] ?? 0;
        s.turn[i] = s.tturn[i] ?? REST;
        s.vx[i] = 0;
        s.vturn[i] = 0;
        s.swing[i] = 0;
        s.vswing[i] = 0;
        paint(i);
      }
      return;
    }
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(step);
    }
  }, [paint, step]);

  const impulse = useCallback(
    (i: number, amount: number) => {
      const s = sim.current;
      if (live.current.reduced || i < 0 || i >= live.current.count) return;
      s.vswing[i] = (s.vswing[i] ?? 0) + amount;
      kick();
    },
    [kick],
  );

  useLayoutEffect(() => {
    if (!size.width) return;
    const s = sim.current;
    const front = size.carousel ? (active ?? live.current.carouselIndex) : active;
    const xs = targets(size.h, size.width, size.carousel, front);
    const fresh = s.x.length !== count;
    for (let i = 0; i < count; i++) {
      s.tx[i] = (xs[i] ?? 0) + (size.carousel ? pointer.current.swipe : 0);
      s.tturn[i] = i === front ? 0 : REST;
      if (fresh || reduced) {
        s.x[i] = s.tx[i] ?? 0;
        s.vx[i] = 0;
        s.turn[i] = s.tturn[i] ?? REST;
        s.vturn[i] = 0;
        s.tag[i] = 0;
        s.vtag[i] = 0;
      }
    }
    if (fresh) {
      s.x.length = count;
      for (let i = 0; i < count; i++) paint(i);
    }
    kick();
  }, [size, active, count, reduced, targets, paint, kick]);

  /* A hand run along the rail as it arrives, so the first thing a visitor
   * sees is cloth with weight rather than a still photograph of a rail. */
  const brushed = useRef(false);
  useEffect(() => {
    if (!size.width || brushed.current || reduced) return;
    brushed.current = true;
    const timers = items.map((_, i) =>
      window.setTimeout(() => impulse(i, 44 - i * 3), 140 + i * 60),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [size.width, reduced, items, impulse]);

  useEffect(
    () => () => {
      cancelAnimationFrame(sim.current.raf);
      sim.current.raf = 0;
    },
    [],
  );

  useLayoutEffect(() => {
    if (openIndex !== null || returnFocus.current === null) return;
    const index = returnFocus.current;
    returnFocus.current = null;
    slots.current[index]?.focus({ preventScroll: true });
  }, [openIndex]);

  const choose = useCallback(
    (index: number | null) => {
      setActive((old) => {
        if (old === index) return old;
        if (index !== null) {
          impulse(index - 1, -30);
          impulse(index + 1, 30);
          live.current.carouselIndex = index;
        }
        if (old !== null && old !== index) {
          impulse(old - 1, 14);
          impulse(old + 1, -14);
        }
        return index;
      });
    },
    [impulse],
  );

  const stop = useCallback(() => setPlaying(false), []);

  useEffect(() => {
    if (!playing || reduced || openIndex !== null || count === 0 || !size.width) return;
    let timer = window.setTimeout(
      function advance() {
        const current = live.current.active;
        choose(current === null ? 0 : (current + 1) % live.current.count);
        timer = window.setTimeout(advance, interval);
      },
      active === null ? 1200 : interval,
    );
    return () => window.clearTimeout(timer);
  }, [playing, reduced, openIndex, count, interval, size.width, choose, active]);

  const open = useCallback(
    (index: number) => {
      stop();
      setActive(index);
      setOpenIndex(index);
    },
    [stop],
  );

  function nearest(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage) return null;
    const box = stage.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const { h } = live.current.size;
    if (y < 0 || y > h + 46) return null;
    const s = sim.current;
    let best: number | null = null;
    let distance = Infinity;
    for (let i = 0; i < live.current.count; i++) {
      const half = footprint(h, s.turn[i] ?? REST) / 2 + 4;
      const d = Math.abs(x - (s.x[i] ?? 0));
      if (d < half && d < distance) {
        best = i;
        distance = d;
      }
    }
    return best;
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const p = pointer.current;
    const s = sim.current;
    const stage = stageRef.current;
    if (p.id === event.pointerId && stage) {
      const dx = event.clientX - p.x;
      const now = performance.now();
      if (!p.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - p.y)) {
        p.moved = true;
        stop();
        if (stage.isConnected) stage.setPointerCapture(event.pointerId);
        if (!live.current.size.carousel && p.index >= 0) {
          s.drag = p.index;
          s.grab = event.clientX - stage.getBoundingClientRect().left - (s.x[p.index] ?? 0);
        }
      }
      if (p.moved) {
        const v = (event.clientX - p.lastX) / Math.max(1, now - p.lastT);
        p.v = p.v * 0.6 + v * 0.4;
        p.lastX = event.clientX;
        p.lastT = now;
        if (s.drag >= 0) {
          s.vx[s.drag] = p.v * 1000;
          s.x[s.drag] = event.clientX - stage.getBoundingClientRect().left - s.grab;
          s.free = now + 900;
          kick();
        } else if (live.current.size.carousel) {
          p.swipe = dx;
          const xs = targets(
            live.current.size.h,
            live.current.size.width,
            true,
            live.current.active ?? live.current.carouselIndex,
          );
          for (let i = 0; i < live.current.count; i++) s.tx[i] = (xs[i] ?? 0) + dx;
          kick();
        }
      }
      return;
    }
    /* Hover only turns a garment with a real mouse. On touch the finger is
     * also the thing that scrolls, and turning a shirt because somebody
     * swiped past it is the kind of help nobody asked for. */
    if (
      event.pointerType !== "mouse" ||
      live.current.size.carousel ||
      live.current.openIndex !== null
    )
      return;
    const hit = nearest(event.clientX, event.clientY);
    if (hit !== null) {
      stop();
      choose(hit);
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const hit = nearest(event.clientX, event.clientY);
    const now = performance.now();
    pendingOpen.current = -1;
    pointer.current = {
      id: event.pointerId,
      index: hit ?? -1,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      kind: event.pointerType,
      swipe: 0,
      lastX: event.clientX,
      lastT: now,
      v: 0,
    };
  };

  const finishPointer = (event: React.PointerEvent, cancelled: boolean) => {
    const p = pointer.current;
    if (p.id !== event.pointerId) return;
    const s = sim.current;
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    pointer.current = { ...p, id: -1 };

    if (s.drag >= 0) {
      s.drag = -1;
      s.free = performance.now() + 700;
      kick();
      return;
    }
    if (p.moved && live.current.size.carousel) {
      const dx = event.clientX - p.x;
      const current = live.current.active ?? live.current.carouselIndex;
      const move = Math.abs(dx) > 40 || Math.abs(p.v) > 0.45 ? (dx < 0 ? 1 : -1) : 0;
      pointer.current.swipe = 0;
      choose(clamp(current + move, 0, live.current.count - 1));
      for (let i = 0; i < live.current.count; i++) impulse(i, clamp(-p.v * 22, -30, 30));
      return;
    }
    if (cancelled || p.moved || p.index < 0) return;
    stop();
    /* On touch the first press turns the garment and the second opens it.
     * One press doing both means a visitor who wanted a closer look at the
     * front gets a dialog instead, every time. */
    const touch = p.kind !== "mouse";
    if (touch && live.current.active !== p.index) choose(p.index);
    else pendingOpen.current = p.index;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    stop();
    const from = active ?? focusIndex;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? count - 1
          : clamp(from + (event.key === "ArrowRight" ? 1 : -1), 0, count - 1);
    setFocusIndex(next);
    choose(next);
    slots.current[next]?.focus({ preventScroll: true });
  };

  const current = active === null ? null : items[active];
  const h = size.h;
  const boxW = h * ASPECT;
  const railY = Math.round(h * 0.07) + 10;
  const railR = Math.max(3, Math.round((4.6 / VB_H) * h * 10) / 10);

  if (count === 0) return null;

  return (
    <div className="w-full">
      <Defs uid={uid} />

      <div
        ref={stageRef}
        role="group"
        aria-label={caption ?? "The rail"}
        className="relative w-full touch-pan-y select-none"
        style={{ height: Math.round(railY + h + h * 0.06), overflowX: "clip" }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={(event) => finishPointer(event, false)}
        onPointerCancel={(event) => finishPointer(event, true)}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" && pointer.current.id < 0 && !size.carousel)
            choose(null);
        }}
        onKeyDown={onKeyDown}
      >
        {/* THE BAR. Lit from above like everything else in this building, with
            a bracket at each end so it reads as fixed to a wall rather than
            floating. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-0"
          style={{ top: railY - railR, height: railR * 2 }}
        >
          <div
            className="absolute inset-x-0 h-3 bg-black/45 blur-[6px]"
            style={{ top: railR * 2 + 1 }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--line-strong) 25%, white) 0%, color-mix(in oklab, var(--line-strong) 55%, white) 22%, var(--line-strong) 58%, color-mix(in oklab, var(--line-strong) 70%, black) 100%)",
            }}
          />
          {[0, 1].map((end) => (
            <div
              key={end}
              className="absolute top-1/2 h-7 w-[14px] -translate-y-1/2 border border-line"
              style={{
                [end ? "right" : "left"]: 0,
                background: "linear-gradient(to bottom, var(--surface-raised), var(--surface))",
              }}
            >
              <span className="absolute left-1/2 top-[5px] size-[3px] -translate-x-1/2 rounded-full bg-acid/70" />
              <span className="absolute bottom-[5px] left-1/2 size-[3px] -translate-x-1/2 rounded-full bg-line-strong" />
            </div>
          ))}
        </div>

        {items.map((item, i) => {
          const turned = active === i;
          return (
            <button
              key={item.id}
              ref={(node) => {
                slots.current[i] = node;
              }}
              type="button"
              data-garment={i}
              data-front={turned || undefined}
              tabIndex={i === (active ?? focusIndex) ? 0 : -1}
              aria-label={item.price ? `${item.name}, ${inr(item.price)}` : item.name}
              aria-pressed={turned}
              className="absolute left-0 cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
              style={{
                top: railY - (HOOK_TOP / VB_H) * h,
                width: boxW,
                height: h,
                zIndex: turned ? 30 : 10 + i,
                transform: `translate3d(${((sim.current.x[i] ?? 0) - boxW / 2).toFixed(2)}px,0,0)`,
              }}
              onFocus={() => {
                setFocusIndex(i);
                if (pointer.current.id < 0) {
                  stop();
                  choose(i);
                }
              }}
              onClick={(event) => {
                const pending = pendingOpen.current;
                pendingOpen.current = -1;
                /* detail === 0 is a keyboard press, which should open at once
                 * — there is no "turn it first" step with a keyboard. */
                if (event.detail === 0 || pending === i) open(i);
              }}
            >
              <span
                ref={(node) => {
                  swings.current[i] = node;
                }}
                className="absolute inset-0"
                style={{ transformOrigin: `50% ${(HOOK_TOP / VB_H) * 100}%` }}
              >
                {/* The shadow it casts on the wall behind. Blurred inside the
                    SVG rather than by a CSS filter on a wrapper, so what is
                    blurred is the garment's shape and not its box. */}
                <Silhouette
                  side="front"
                  blur={3.4}
                  innerRef={(node) => {
                    shadows.current[i] = node;
                  }}
                  className="pointer-events-none absolute inset-0 size-full overflow-visible opacity-45"
                  style={{ transformOrigin: "top center" }}
                />

                <span
                  ref={(node) => {
                    sides.current[i] = node;
                  }}
                  className="absolute inset-0"
                >
                  <SideHanger uid={uid} />
                  <SideCloth uid={uid} image={item.image} gone={item.gone} />
                </span>

                <span
                  ref={(node) => {
                    turns.current[i] = node;
                  }}
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  style={{
                    transform: `perspective(${PERSPECTIVE}px) rotateY(${REST}deg)`,
                    opacity: 0,
                  }}
                >
                  {(["front", "back"] as const).map((side) => (
                    <span
                      key={side}
                      className="absolute inset-0 [backface-visibility:hidden]"
                      style={{ transform: side === "back" ? "rotateY(180deg)" : undefined }}
                    >
                      <Hanger uid={uid} side={side} />
                      <Cloth
                        uid={uid}
                        side={side}
                        image={(side === "back" ? item.backImage : undefined) ?? item.image}
                        gone={item.gone}
                      />
                      <Silhouette
                        side={side}
                        innerRef={
                          side === "front"
                            ? (node) => {
                                shades.current[i] = node;
                              }
                            : undefined
                        }
                        className="pointer-events-none absolute inset-0 size-full overflow-visible"
                        style={{ opacity: "var(--shade, 0.2)" }}
                      />
                    </span>
                  ))}
                </span>

                {/* THE HANG TAG. Card, string, the price in the same tabular
                    figure the rates and the specs use. It trails the swing,
                    which is the detail that sells the weight. */}
                {item.price ? (
                  <span
                    ref={(node) => {
                      tags.current[i] = node;
                    }}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 origin-top"
                    style={{ top: (30 / VB_H) * h, transform: "rotate(-11deg)" }}
                  >
                    <span className="block h-[14px] w-px translate-x-[3px] bg-line-strong" />
                    <span className="relative block translate-x-[-50%] whitespace-nowrap border border-line bg-surface-raised px-2 pb-1 pt-2 text-center">
                      <span className="absolute left-1/2 top-[3px] size-[3px] -translate-x-1/2 rounded-full bg-acid" />
                      <span className="tnum block font-ui text-[10px] font-bold leading-none tracking-[0.04em] text-text">
                        {item.gone ? "Gone" : inr(item.price)}
                      </span>
                      {item.compareAt && !item.gone ? (
                        <span className="tnum mt-0.5 block font-ui text-[8px] leading-none text-mute line-through">
                          {inr(item.compareAt)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* On a phone the rail is one garment at a time, so it needs a position
          readout. Full-width hit areas, not 6px dots: this is the control a
          thumb reaches for most. */}
      {size.carousel && count > 1 ? (
        <div
          className="mt-4 flex items-stretch justify-center gap-1"
          role="group"
          aria-label={labels.show}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`${labels.show} ${item.name}`}
              aria-current={carouselIndex === i}
              onClick={() => {
                stop();
                choose(i);
              }}
              className="tap-area relative flex h-11 flex-1 items-center justify-center"
            >
              <span
                className={`block h-[3px] w-full transition-colors duration-300 ${carouselIndex === i ? "bg-acid" : "bg-line-strong"}`}
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* The caption. One line that answers "what am I looking at", replaced
          by the garment's own name the moment one is turned. */}
      <div aria-live="polite" className="mt-5 min-h-[4.5rem] text-center">
        {current ? (
          <>
            <p className="font-display text-[18px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-text sm:text-[22px]">
              {current.name}
            </p>
            {current.blurb ? (
              <p className="mx-auto mt-2 max-w-[46ch] font-ui text-[13px] leading-[1.55] text-mute">
                {current.blurb}
              </p>
            ) : null}
          </>
        ) : (
          <p className="t-label mx-auto max-w-[40ch] text-mute">{caption}</p>
        )}
      </div>

      {openIndex !== null && items[openIndex] ? (
        <Detail
          uid={uid}
          item={items[openIndex]}
          index={openIndex}
          total={count}
          labels={labels}
          reduced={reduced}
          onClose={() => {
            const index = openIndex;
            returnFocus.current = index;
            setOpenIndex(null);
            impulse(index, (index % 2 ? 1 : -1) * 44);
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Lifted off the rail
 *
 * A full view of one piece that you can turn with a drag, or with the two
 * named controls for anyone who cannot drag. On a phone it is a sheet
 * rather than a centred dialog: the garment is tall and portrait, and
 * centring it in a 670px viewport leaves the name and the price in the
 * last 80 pixels.
 * ------------------------------------------------------------------ */

function Detail({
  uid,
  item,
  index,
  total,
  labels,
  reduced,
  onClose,
}: {
  uid: string;
  item: RailGarment;
  index: number;
  total: number;
  labels: { front: string; back: string; close: string; show: string; see: string };
  reduced: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const spinRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [side, setSide] = useState<Side>("front");
  const [shown, setShown] = useState(false);
  const angle = useRef({
    value: 0,
    target: 0,
    velocity: 0,
    raf: 0,
    last: 0,
    dragging: false,
    startX: 0,
    startAngle: 0,
  });

  const titleId = `${uid}-detail-title`;

  const spin = useCallback(() => {
    const a = angle.current;
    const node = spinRef.current;
    const loop = (now: number) => {
      const dt = a.last ? Math.min(0.034, (now - a.last) / 1000) : 1 / 60;
      a.last = now;
      a.velocity += (-90 * (a.value - a.target) - 2 * Math.sqrt(90) * 0.82 * a.velocity) * dt;
      a.value += a.velocity * dt;
      if (node) node.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
      if (Math.abs(a.value - a.target) < 0.05 && Math.abs(a.velocity) < 0.05) {
        a.value = a.target;
        if (node) node.style.transform = `rotateY(${a.value}deg)`;
        a.raf = 0;
        a.last = 0;
        return;
      }
      a.raf = requestAnimationFrame(loop);
    };
    if (reduced) {
      a.value = a.target;
      if (node) node.style.transform = `rotateY(${a.value}deg)`;
      return;
    }
    if (!a.raf) a.raf = requestAnimationFrame(loop);
  }, [reduced]);

  const turnTo = useCallback(
    (next: Side) => {
      const a = angle.current;
      const base = Math.round(a.value / 360) * 360;
      a.target = base + (next === "back" ? 180 : 0);
      if (Math.abs(a.target - a.value) > 180) a.target -= 360 * Math.sign(a.target - a.value);
      setSide(next);
      spin();
    },
    [spin],
  );

  useLayoutEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setShown(true));
    /* Held in a local for the cleanup: the ref points at a plain object that
     * is never reassigned, so this is the same object either way — but the
     * rule cannot know that, and one real warning is worth more than a
     * suppressed one. */
    const spinState = angle.current;
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      cancelAnimationFrame(spinState.raf);
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      turnTo(side === "front" ? "back" : "front");
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...(dialogRef.current?.querySelectorAll("button, a[href]") ?? []),
    ] as HTMLElement[];
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[9000] flex items-end justify-center overflow-y-auto md:items-center"
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-surface-deep/92 backdrop-blur-xl transition-opacity duration-300 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className="relative w-full max-w-[1100px] border-t border-line bg-surface px-[var(--page-margin)] pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-6 md:border md:px-10 md:py-10">
        <div className="flex items-start justify-between gap-4">
          <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-mute">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-2 flex h-11 items-center gap-2 px-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-acid-type"
          >
            {labels.close}
            <X size={14} />
          </button>
        </div>

        <div className="mt-4 grid items-center gap-8 md:mt-2 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:gap-12">
          {/* The piece, still on its hanger, hanging from a rod that runs off
              the top of the view — it has been lifted off the rail, not
              taken out of the world. */}
          <div className="relative mx-auto aspect-[200/310] h-[min(46vh,420px)] w-auto md:h-[min(62vh,560px)]">
            <div
              aria-hidden="true"
              className="absolute left-1/2 w-px -translate-x-1/2 bg-line-strong"
              style={{ top: `calc(-40vh + ${(HOOK_TOP / VB_H) * 100}%)`, height: "40vh" }}
            />
            <div
              className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
              style={{ perspective: "1400px" }}
              onPointerDown={(event) => {
                const a = angle.current;
                a.dragging = true;
                a.startX = event.clientX;
                a.startAngle = a.value;
                cancelAnimationFrame(a.raf);
                a.raf = 0;
                a.last = 0;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const a = angle.current;
                if (!a.dragging) return;
                a.value = clamp(
                  a.startAngle + (event.clientX - a.startX) * 0.45,
                  a.startAngle - 220,
                  a.startAngle + 220,
                );
                if (spinRef.current)
                  spinRef.current.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
              }}
              onPointerUp={() => {
                const a = angle.current;
                if (!a.dragging) return;
                a.dragging = false;
                const facing = ((a.value % 360) + 360) % 360;
                turnTo(facing > 90 && facing < 270 ? "back" : "front");
              }}
              onPointerCancel={() => {
                angle.current.dragging = false;
                turnTo(side);
              }}
            >
              <div ref={spinRef} className="absolute inset-0 [transform-style:preserve-3d]">
                {(["front", "back"] as const).map((face) => (
                  <div
                    key={face}
                    className="absolute inset-0 [backface-visibility:hidden]"
                    style={{ transform: face === "back" ? "rotateY(180deg)" : undefined }}
                  >
                    <Hanger uid={uid} side={face} />
                    <Cloth
                      uid={uid}
                      side={face}
                      image={(face === "back" ? item.backImage : undefined) ?? item.image}
                      gone={item.gone}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`flex flex-col gap-4 transition-[opacity,transform] duration-500 motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
          >
            {item.by ? <span className="t-label text-mute">{item.by}</span> : null}
            <h3
              id={titleId}
              className="font-display text-[26px] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] text-text sm:text-[34px]"
            >
              {item.name}
            </h3>
            {item.price ? (
              <p className="tnum font-display text-[22px] font-extrabold leading-none tracking-[-0.02em] text-text">
                {inr(item.price)}
                {item.compareAt ? (
                  <span className="tnum ml-2 font-ui text-[13px] font-normal text-mute line-through">
                    {inr(item.compareAt)}
                  </span>
                ) : null}
              </p>
            ) : null}
            {item.blurb ? (
              <p className="font-ui text-[14px] leading-[1.6] text-mute">{item.blurb}</p>
            ) : null}

            {item.details && item.details.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {item.details.map((detail) => (
                  <li
                    key={detail}
                    className="border border-line px-3 py-1.5 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-mute"
                  >
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}

            <div
              role="group"
              aria-label={`${labels.front} / ${labels.back}`}
              className="mt-1 flex gap-6"
            >
              {(["front", "back"] as const).map((face) => (
                <button
                  key={face}
                  type="button"
                  aria-pressed={side === face}
                  onClick={() => turnTo(face)}
                  className={`relative flex h-11 items-center font-ui text-[12px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 ${side === face ? "text-text" : "text-mute hover:text-text"}`}
                >
                  {face === "front" ? labels.front : labels.back}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-2 h-px origin-left bg-acid transition-transform duration-300 motion-reduce:transition-none ${side === face ? "scale-x-100" : "scale-x-0"}`}
                  />
                </button>
              ))}
            </div>

            {item.productId ? (
              <Link
                to="/shop/$id"
                params={{ id: item.productId }}
                onClick={onClose}
                className="fill-acid group mt-2 flex h-[52px] items-center justify-between border border-line bg-surface-raised px-5 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300"
              >
                {labels.see}
                <ArrowUpRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
