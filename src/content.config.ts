import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The journal is Markdown on disk, not a TypeScript array. Headings, figures
 * and footnotes are the point of a reading surface, and they only exist if the
 * writing itself carries them — a `body: string[]` can't hold a subhead.
 */
const journal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/journal" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Sits above the title. One or two words — what kind of piece this is.
    kind: z.string().default("note"),
    // The standfirst: the paragraph under the title, before the first heading.
    standfirst: z.string(),
    // `false` keeps a piece out of the index, the routes and the sitemap.
    published: z.boolean().default(false),
  }),
});

export const collections = { journal };
