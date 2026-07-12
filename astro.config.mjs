import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// FR is the default locale (served at root). AR is served under /ar (RTL).
// Locale is driven explicitly via a `locale` prop on view components, so no
// built-in i18n routing magic is needed — fewer surprises, fully controllable.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  server: { port: 4321, host: true },
});
