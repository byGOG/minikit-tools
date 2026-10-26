import { defineConfig } from 'astro/config';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import {getSiteConfig} from './scripts/site-config.mjs';

export default defineConfig({
  ...getSiteConfig(),
  vite: { css: { postcss: { plugins: [tailwindcss(), autoprefixer()] } } },
  output: 'static',
});

