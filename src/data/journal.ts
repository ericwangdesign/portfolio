export type JournalStatus = "public" | "draft" | "private";

export type JournalEntry = {
  slug: string;
  title: string;
  date: string;
  category: string;
  status: JournalStatus;
  excerpt: string;
  accent: string;
  paper: string;
  position: {
    x: number;
    y: number;
    rotate: number;
    width: number;
  };
  body: string[];
  notes?: string[];
};

export const journalEntries: JournalEntry[] = [
  {
    slug: "desk-covered-in-living-papers",
    title: "A desk covered in living papers",
    date: "2026-06-28",
    category: "site note",
    status: "public",
    excerpt:
      "The journal should not behave like a blog archive. It should feel like a landscape of thoughts, with each page keeping its own gravity.",
    accent: "#ff7a59",
    paper: "#fff7df",
    position: { x: 160, y: 140, rotate: -4, width: 320 },
    body: [
      "I want the journal to open like a desk, not a feed. A place where each note has a physical presence before it becomes a polished essay.",
      "Some papers are tiny scraps. Some are long, deliberate arguments. Some are just a title and a date waiting for a future version of me to remember why they mattered.",
      "The canvas is useful because it lets writing keep its mess without becoming careless. It can hold proximity, obsession, return, and drift. A list can only say newest first.",
    ],
    notes: [
      "Built as the first public seed for /journal.",
      "Future notes can be public, draft, or private.",
    ],
  },
  {
    slug: "rabbithole-protocol",
    title: "Rabbithole protocol",
    date: "2026-06-28",
    category: "rabbit hole",
    status: "public",
    excerpt:
      "A format for following an idea until it starts drawing its own map: references, screenshots, side notes, questions, and the strange little turns.",
    accent: "#2f7f75",
    paper: "#f4f0ff",
    position: { x: 560, y: 250, rotate: 3, width: 350 },
    body: [
      "A rabbithole entry begins with a pull: a map detail, an interface decision, a sentence, a behavior, a feeling that refuses to leave.",
      "The point is not to summarize the topic. The point is to document the chase. What did I notice first? What changed when I looked again? Which reference made the question sharper?",
      "This format should leave room for evidence. Screenshots, captions, comparisons, tiny diagrams, and process notes should sit close to the writing instead of being treated as decoration.",
    ],
    notes: [
      "Inspired by long visual essays and obsessive comparison pages.",
      "Good for design teardowns, map observations, product details, and AI experiments.",
    ],
  },
  {
    slug: "written-with-codex",
    title: "Written with Codex",
    date: "2026-06-28",
    category: "collaboration",
    status: "public",
    excerpt:
      "A public trace of writing with an assistant: rough thought, shaping, disagreement, revision, and the final thing that survives.",
    accent: "#7b61ff",
    paper: "#eaf7ff",
    position: { x: 300, y: 530, rotate: 5, width: 330 },
    body: [
      "This journal is also a record of collaboration. I will write in conversation, then decide what becomes public.",
      "The useful part is not that an assistant helped. The useful part is seeing how a thought changes when it is reflected, questioned, reorganized, or refused.",
      "Some entries may show the process. Others may hide it. The important thing is that the writing still sounds like me by the time it reaches the page.",
    ],
    notes: [
      "Public entries can include collaboration notes.",
      "Private thoughts should stay outside the public repository.",
    ],
  },
  {
    slug: "private-placeholder",
    title: "Private thought placeholder",
    date: "2026-06-28",
    category: "private note",
    status: "private",
    excerpt: "This entry demonstrates filtering and should never render on the public journal.",
    accent: "#111111",
    paper: "#eeeeee",
    position: { x: 760, y: 60, rotate: -2, width: 300 },
    body: [
      "Private entries are filtered out of public routes. Because this repository is public, real private writing should live somewhere else.",
    ],
  },
];

export const publicJournalEntries = journalEntries.filter(
  (entry) => entry.status === "public",
);
