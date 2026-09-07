// Define los esquemas de contenido para Astro 7.
// Usamos loaders `glob` porque las colecciones legacy en src/content/config.ts
// ya no son válidas en versiones modernas de Astro.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const curiosidades = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/curiosidades' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    image: z.string(),
    publishedAt: z.string(),
    readingTime: z.number(),
    sourceTitle: z.string(),
    sourceUrl: z.string().url(),
  }),
});

const enigmas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/enigmas' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    difficulty: z.string(),
    estimatedTime: z.string(),
    tags: z.array(z.string()),
    publishedAt: z.string(),
  }),
});

export const collections = { curiosidades, enigmas };
