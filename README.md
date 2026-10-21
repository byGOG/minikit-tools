# MiniKit

A lightweight, bilingual (Turkish and English) collection of useful browser-based tools. Built with Astro, TypeScript and Tailwind CSS; deployed for free with GitHub Pages.

## Included in this MVP

- Responsive Turkish/English landing page and language switcher
- Image converter for WebP, JPEG and PNG with adjustable quality
- QR code generator with downloadable PNG output
- Live word, character and reading-time counter
- HEX, RGB and HSL color converter with copy buttons
- Search and social metadata, favicon and robots.txt
- Privacy-forward design: image conversion and text/color tools run in the visitor's browser; QR data is encoded locally

## Run locally

Requirements: Node.js 20.3 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Astro. To create and inspect the production build locally:

```sh
npm run build
npm run preview
```

## GitHub Pages deployment

1. Push this project to the `main` branch of `byGOG/minikit-tools` (or update the `base` setting in `astro.config.mjs` for your repository name).
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source if it is not already selected.
3. The workflow in `.github/workflows/deploy.yml` builds the Astro site and publishes the `dist/` output. The live site is served at `https://bygog.github.io/minikit-tools/` after the workflow succeeds.
4. Future pushes to `main` trigger new deployments automatically.

GitHub Pages is free for public repositories. No server, database or paid image API is required for this project.

## Before a public launch

- Replace the default metadata and add a canonical URL and custom domain after choosing a domain.
- Add a privacy policy and contact details appropriate for your audience and jurisdiction.
- If adding advertising, analytics, cookies or third-party processing, update the privacy notice and consent flow as required.
- Test image formats in the browsers you plan to support. Browser codec support can vary.
- Add a sitemap and individual localized pages if expanding the content and SEO strategy.

## Project layout

```text
src/
  layouts/Layout.astro   Shared document shell and SEO metadata
  pages/index.astro      Landing page and tool interface
  scripts/app.ts         Bilingual UI and browser-side tools
public/
  favicon.svg
  robots.txt
```

