// Homepage content — mirrors the Figma "Home" frame (file iowWbGxgrpryC9s62qGWGY, node 63:3).
// Everything the landing page renders lives here so copy edits never touch layout.

/**
 * `href` makes the row a link that grows an ↗ on hover.
 * `locked` marks work that exists but can't be shown — a padlock on hover
 * instead, and the row stays unclickable.
 */
export type WorkItem = {
  title: string;
  year: string;
  href?: string;
  locked?: boolean;
};
export type WorkGroup = { company: string; items: WorkItem[] };

export const workGroups: WorkGroup[] = [
  {
    company: "Google",
    items: [
      {
        title: "BaseMap Cartography",
        year: "2026",
        href: "https://maps.google.com",
      },
      { title: "Landmark in Navigation", year: "2026", locked: true },
      {
        title: "Ads in Google Map",
        year: "2026",
        href: "https://business.google.com/uk/resources/articles/get-the-most-out-of-advertising-on-google-maps/",
      },
      {
        title: "Gemini in Maps",
        year: "2025-26",
        href: "https://blog.google/products-and-platforms/products/maps/order-food-in-ask-maps/",
      },
      {
        title: "Satellite Map",
        year: "2025-26",
        href: "https://earth.google.com/web/",
      },
    ],
  },
  {
    company: "Tesla",
    items: [
      {
        title: "Robotaxi",
        year: "2025",
        href: "https://www.tesla.com/robotaxi",
      },
      { title: "Internal Knowledge Search", year: "2025", locked: true },
      { title: "Finance Dashboard", year: "2025", locked: true },
    ],
  },
];

export type ExperimentCard = {
  title: string;
  /** Right-aligned date inside the card. */
  date?: string;
  /** Card height in px, straight from the Figma masonry. */
  height: number;
  /** Omit to render an unlinked placeholder card. */
  href?: string;
  /** Card artwork — .mp4/.webm autoplay muted and looping, anything else as an image. */
  media?: string;
  /**
   * With no `media`, a linked card runs a live scaled-down preview of the page
   * itself, so the tile is already in motion. Set false to leave it flat.
   */
  preview?: boolean;
  /**
   * A `media` card whose recording only suits the night page: in day mode the
   * tile runs the piece itself, live and touchable, and the recording rests.
   */
  liveInDay?: boolean;
  /** Dim the label — used for the "more in the making…" tile. */
  muted?: boolean;
  /** Push the label to the right edge. */
  alignEnd?: boolean;
};

// Two tiles side by side, one per column, both 400 tall so the grid sits
// flush. Water keeps the height it had so the phone recording crops the same;
// Cities is a live preview and takes whatever height it is given.
export const experimentColumns: ExperimentCard[][] = [
  [
    { title: "Cities", date: "Jun 2026", height: 400, href: "/cities" },
  ],
  [
    // Water absorbed the old "Liquid" card — same project, later milestone.
    // The June phone recording stands in for the live preview: it shows the
    // thing being *used*, which an iframe of the page cannot. It was shot in a
    // dark room, so by day the tile is the marble itself instead.
    { title: "Water", date: "Apr 2026", height: 400, href: "/water",
      media: "/water/card.mp4", liveInDay: true },
  ],
];

export const footerQuote = "by eric (旭飞) wang";

export const footerLinks = [
  { label: "Linkedin", href: "https://www.linkedin.com/in/ericwangdesign/" },
  { label: "X", href: "https://x.com/ericwangdesign" },
  { label: "Email", href: "mailto:ericwanguxdesign@gmail.com" },
  { label: "Privacy", href: "https://www.ericwangdesign.com/privacy/" },
];
