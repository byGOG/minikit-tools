import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://bygog.github.io',
  base: '/minikit-tools',
  integrations: [tailwind()],
  output: 'static',
});

