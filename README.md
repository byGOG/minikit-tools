# MiniKit

MiniKit is a privacy-forward collection of free browser tools, built with Astro, TypeScript and Tailwind CSS and published on GitHub Pages.

## Included

- Turkish and English pages plus up to 11 additional locales: Spanish, German, French, Portuguese, Russian, Italian, Arabic, Chinese, Japanese, Hindi and Indonesian.
- Four browser tools: image converter/compressor (WebP, JPEG and PNG), QR generator, Unicode-aware word/character counter, and HEX/RGB/HSL color converter.
- Dedicated localized pages for each tool, with usage steps, FAQs, structured data, canonical/hreflang metadata and sitemap entries.
- Accessibility support: keyboard skip link, visible focus, reduced-motion support, accessible mobile menu state and live word-count announcements.
- No third-party analytics, ads, font requests or cookie tracking by default. Tool inputs are processed in the visitor's browser.
- Optional Google Search Console verification via GitHub Actions secret.

## Run locally

Requirements: Node.js 20.3 or newer.

```sh
npm install
npm run dev
```

Build and preview:

```sh
npm run build
npm run preview
```

## GitHub Pages deployment

1. Push to the `main` branch of `byGOG/minikit-tools`. For another repository, update the `base` value in `astro.config.mjs`.
2. In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Each push to `main` builds the localized landing pages and tool pages, sitemap and robots file, then deploys `dist/` to [MiniKit](https://bygog.github.io/minikit-tools/).
4. Share the update after **Deploy MiniKit to GitHub Pages** finishes successfully.

## Google Search Console

1. Add a repository secret named `GOOGLE_SITE_VERIFICATION` under **Settings → Secrets and variables → Actions → New repository secret**.
2. Paste the verification token supplied by Search Console.
3. Run the workflow again. The build adds Google's verification meta tag only when the secret exists.
4. In Search Console, submit `https://bygog.github.io/minikit-tools/sitemap.xml`.

Analytics and advertising are disabled. Add them only after setting up the relevant account, providing its ID, and updating the privacy and consent experience for the intended markets.

## Translation notes

The supported locale list is Turkish, English, Spanish, German, French, Portuguese, Russian, Italian, Arabic, Chinese, Japanese, Hindi and Indonesian. The free MyMemory service may be used during builds for missing fixed interface strings; visitor files and tool input are never sent to it. Published locale JSON is reused to reduce anonymous translation quota usage. Review machine translations before targeting a market commercially.

## Before scaling traffic

- Connect Search Console and monitor indexing, queries and sitemap processing.
- Review translations and search intent for each market.
- Add a contact and privacy policy page before enabling advertising, analytics or other third-party processing.
- Check image codec support across target browsers.

## Project layout

```text
src/
  layouts/Layout.astro   Shared shell, metadata and optional verification
  pages/index.astro      Landing page, tools and tool-page links
  scripts/app.ts         Localized UI and browser-side tools
scripts/
  generate-locales.mjs      Language pages and home sitemap
  generate-tool-pages.mjs   Localized tool pages and SEO metadata
public/
  favicon.svg
  robots.txt
```
