import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    column: z.string().optional(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const columns = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/columns" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    accent: z.enum(["berry", "teal", "gold", "violet", "green"]).default("teal"),
    group: z.enum(["writing", "journal"]).default("writing"),
    order: z.number().default(50),
    draft: z.boolean().default(false),
  }),
});

const diary = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/diary" }),
  schema: z.object({
    title: z.string(),
    datetime: z.coerce.date(),
    mood: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, columns, diary };
