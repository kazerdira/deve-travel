import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const bi = z.object({ fr: z.string(), ar: z.string().optional() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    order: z.number(),
    icon: z.string(),
    available: z.boolean().default(true),
    title: bi,
    tagline: bi,
    summary: bi,
    includes: z.array(bi).default([]),
    whatsapp: bi,
    destinations: z.array(z.string()).default([]),
    seo: z.object({ title: bi, description: bi }).optional(),
  }),
});

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: z.object({
    order: z.number(),
    available: z.boolean().default(true),
    flag: z.string(),
    title: bi,
    intro: bi,
    tracks: z.array(z.object({
      key: z.enum(['student', 'worker', 'pr']),
      title: bi,
      points: z.array(bi).default([]),
    })).default([]),
    services: z.array(z.string()).default([]),
    seo: z.object({ title: bi, description: bi }).optional(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    city: z.string(),
    destination: z.string().optional(),
    quote: z.object({ fr: z.string(), ar: z.string().optional() }),
  }),
});

export const collections = { services, destinations, testimonials };
