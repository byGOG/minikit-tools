import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import {getSiteConfig} from './scripts/site-config.mjs';

export default defineConfig({
  ...getSiteConfig(),
  integrations: [tailwind()],
  output: 'static',
});

