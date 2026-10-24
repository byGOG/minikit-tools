# MiniKit

MiniKit is a privacy-forward collection of free browser tools, built with Astro, TypeScript and Tailwind CSS and published on GitHub Pages.

## Included

- Exactly 50 language homepages and 800 localized tool guides, generated from versioned translation dictionaries. Arabic, Urdu, Persian and Hebrew use right-to-left layouts.
- Sixteen browser tools: image converter/compressor (WebP, JPEG and PNG), QR generator, Unicode-aware word/character counter, HEX/RGB/HSL color converter, case converter, duplicate line remover, text sorter, JSON formatter, UTF-8 Base64 converter URL component encoder/decoder, random password generator, measurement unit converter percentage calculator, image resizer, cropper and rotator/mirror.
- Dedicated localized pages for each tool, with usage steps, FAQs, structured data, canonical/hreflang metadata and sitemap entries.
- Accessibility support: keyboard skip link, visible focus, reduced-motion support, accessible mobile menu state and live word-count announcements.
- No third-party analytics, ads, font requests or cookie tracking by default. Tool inputs are processed in the visitor's browser.
- Optional Google Search Console verification via GitHub Actions secret.

## Run locally

Requirements: Node.js 22 and pnpm 11.25.0 (`corepack enable` then `corepack prepare pnpm@11.25.0 --activate`, or install that pnpm version).

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Build and preview:

```sh
pnpm run build
pnpm run test:tools
pnpm run test:locales
pnpm run check
pnpm run preview
```

`dev` serves the Astro source page. Use `build` followed by `preview` to browse all 50 languages at `http://localhost:4321/minikit-tools/`. Language selection preserves the current tool guide.

## GitHub Pages deployment

1. Push to the `main` branch of `byGOG/minikit-tools`. For another repository, update the `base` value in `astro.config.mjs`.
2. In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Pull requests run type checks, build and locale tests without deploying. Each push to `main` runs the same checks, builds the localized landing pages and tool pages, sitemap and robots file, then deploys `dist/` to [MiniKit](https://bygog.github.io/minikit-tools/).
4. Share the update after **Deploy MiniKit to GitHub Pages** finishes successfully.

## Google Search Console

1. Add a repository secret named `GOOGLE_SITE_VERIFICATION` under **Settings → Secrets and variables → Actions → New repository secret**.
2. Paste the verification token supplied by Search Console.
3. Run the workflow again. The build adds Google's verification meta tag only when the secret exists.
4. In Search Console, submit `https://bygog.github.io/minikit-tools/sitemap.xml`.

Analytics and advertising are disabled. Add them only after setting up the relevant account, providing its ID, and updating the privacy and consent experience for the intended markets.

## Translation notes

All 50 dictionaries live in `src/i18n/locales/`; `src/i18n/catalog.json` defines language names, routes and text direction. Turkish uses the root route; the other languages use their locale code. These codes represent languages, not regional variants or a verified popularity ranking.

The added translations are machine-generated drafts prepared from fixed English site copy using the free Microsoft translation service; existing project translations were retained. They have not been reviewed by native speakers. Review each target market before treating the copy as final.

Builds and visitor sessions never call a translation provider. The build validates the full key set for every language and fails on missing/empty strings or unexpected HTML instead of silently omitting a language. All titles, descriptions, tool instructions, FAQs and runtime messages are stored locally. Updating English copy requires updating the corresponding dictionaries.

Supported languages:

Türkçe (`tr`), English (`en`), Español (`es`), Deutsch (`de`), Français (`fr`), Português (`pt`), Русский (`ru`), Italiano (`it`), العربية (`ar`), 简体中文 (`zh`), 日本語 (`ja`), हिन्दी (`hi`), Bahasa Indonesia (`id`), বাংলা (`bn`), اردو (`ur`), فارسی (`fa`), עברית (`he`), 한국어 (`ko`), Tiếng Việt (`vi`), ไทย (`th`), Bahasa Melayu (`ms`), Nederlands (`nl`), Polski (`pl`), Українська (`uk`), Română (`ro`), Magyar (`hu`), Čeština (`cs`), Ελληνικά (`el`), Svenska (`sv`), Dansk (`da`), Norsk (`no`), Suomi (`fi`), Български (`bg`), Српски (`sr`), Hrvatski (`hr`), Slovenčina (`sk`), Slovenščina (`sl`), Lietuvių (`lt`), Latviešu (`lv`), Eesti (`et`), தமிழ் (`ta`), తెలుగు (`te`), मराठी (`mr`), ગુજરાતી (`gu`), ಕನ್ನಡ (`kn`), മലയാളം (`ml`), ਪੰਜਾਬੀ (`pa`), Kiswahili (`sw`), Filipino (`fil`), Afrikaans (`af`).

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
src/i18n/
  catalog.json             50 locales and writing directions
  locales/*.json           Complete versioned translation drafts
tests/locales.test.mjs      Checks all 850 generated pages and SEO links
public/
  favicon.svg
  robots.txt
```

## Free Cloudflare Pages alternative

1. Connect this GitHub repository to a Cloudflare Pages project.
2. In `astro.config.mjs`, set `site` to your Pages/custom domain and `base` to `/` when serving at the domain root. Keep the existing values for GitHub Pages.
3. Set Node.js to 22, build command to `pnpm install --frozen-lockfile && pnpm run check && pnpm run build && pnpm run test:locales`, and output directory to `dist`.
4. Deploy. The build is fully static and requires no server or translation API key.

## Text tools

All processing stays in the browser. Case conversion uses the selected site language, including Turkish dotted/dotless I. Duplicate removal keeps the first original line, normalizes Unicode only for comparisons and optionally ignores case or surrounding spaces; repeated blank lines are kept once. Sorting uses locale-aware collation and natural numeric order (2 before 10), preserves duplicate/empty lines and supports both directions. Inputs are limited to 100,000 characters; copy and clear controls are provided. Select the site language matching your text for language-specific behavior.

## Developer tools

JSON formatting validates syntax but preserves number spellings, duplicate keys and escaped strings; it does not parse/stringify the output. Pretty printing uses two spaces; minification removes whitespace outside strings. JSON nesting is limited to 100 levels and generated output to 2 million characters. Base64 uses standard alphabet/padding and UTF-8 text, rejects malformed encodings and is not encryption or a binary-file decoder. URL encoding applies to individual values, not whole URLs; decoding keeps `+` literal and decodes once. Each operation accepts up to 100,000 input characters. All three tools run entirely in the browser, show localized errors, clear stale results when input changes, and support copy/clear controls.

## Everyday tools

Passwords use Web Crypto `getRandomValues` with rejection sampling for bounded random choices, guaranteed selected-group coverage and a cryptographic Fisher–Yates shuffle. Length is 8–128 (default 20). No Math.random fallback, password persistence or automatic transmission is used; changing options clears the previous result. The set of constrained passwords is not claimed to be uniformly distributed.

Unit conversion covers length, mass, temperature, US liquid volume and speed; temperatures below absolute zero and nonfinite results are rejected. Unit definitions follow [NIST conversion factors](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8); US liquid gallon is 231 cubic inches and 128 US fluid ounces. Results use 12 significant digits. Numeric fields accept decimal dot/comma and exponent notation, without thousands separators.

Percentage modes are A% of B, A/B × 100 and (B−A)/|A| × 100. Zero denominators/baselines and nonfinite results are errors. These are floating-point utility calculations, rounded to 12 significant digits. Results and errors remain on the device.

## Image editors

The three image editors accept JPEG/PNG/WebP up to 20 MiB, 16 million pixels and 8192 pixels per side. File signatures and decoded dimensions are checked. Decoding is frozen into an original canvas so edits always use the original pixels and animated sources export a single frame. Exports are PNG and retain transparency; metadata is not carried through canvas export.

Resizing uses whole pixels and optional original-aspect-ratio locking; cropping uses top-left pixel coordinates and a centered-square shortcut. Rotation is clockwise in quarter turns; mirroring applies in original-image axes before rotation. Reset restores the original. Controls, preview and downloads are disabled/cleared during loading or invalid edits. Revision tokens prevent older asynchronous image loads/PNG exports from replacing newer results, and obsolete object URLs are revoked. Images and filenames are not uploaded or stored.
