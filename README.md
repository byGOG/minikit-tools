# MiniKit

MiniKit is a privacy-forward collection of free browser tools, built with Astro, TypeScript and Tailwind CSS and published at https://minikit.top on Cloudflare Pages. GitHub Pages preserves legacy redirects.

## Included

- Exactly 50 language homepages and 4,250 localized tool guides, generated from versioned translation dictionaries. Arabic, Urdu, Persian and Hebrew use right-to-left layouts.
- 86 browser tools for images/colors, PDF, audio, text, development, calculations and time. The homepage is a searchable category directory; each tool has its own isolated form.
- Dedicated localized pages for each tool, with usage steps, FAQs, structured data, canonical/hreflang metadata and sitemap entries.
- Accessibility support: keyboard skip link, visible focus, reduced-motion support, accessible mobile menu state and live word-count announcements.
- Tool inputs stay in the visitor's browser. Cloudflare Web Analytics is enabled on the production domain; Google advertising is disabled until the approval and consent requirements in the advertising configuration are met. See `/privacy/` for the current disclosures.
- Optional Google Search Console verification via GitHub Actions secret.

## Run locally

Requirements: Node.js 22.23.4 or newer (24.22.1 is pinned in `.node-version`) and pnpm 11.25.0 (`corepack enable` then `corepack prepare pnpm@11.25.0 --activate`, or install that pnpm version).

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Build and preview:

```sh
MINIKIT_DEPLOY_TARGET=cloudflare pnpm run build
pnpm run test:tools
MINIKIT_DEPLOY_TARGET=cloudflare pnpm run test:locales
pnpm run check
MINIKIT_DEPLOY_TARGET=cloudflare pnpm run preview
```

`dev` serves the full-form Astro source template. Use the Cloudflare build/preview commands above to browse the generated directory and isolated tool pages in all 50 languages at `http://localhost:4321/`. Without the deployment-target variable, the historical `/minikit-tools/` base is used. Language selection preserves the current tool guide.

## Legacy GitHub Pages redirects

1. Push reviewed changes to `main` in `byGOG/minikit-tools`. Cloudflare separately builds that production branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Pull requests run unit/type/locale/browser checks and the security audit. The main-branch workflow then replaces generated HTML with redirects to https://minikit.top and publishes those redirects to the legacy GitHub Pages project.
4. Share the update after **Deploy MiniKit to GitHub Pages** finishes successfully.

## Google Search Console

1. Add a repository secret named `GOOGLE_SITE_VERIFICATION` under **Settings → Secrets and variables → Actions → New repository secret**.
2. Paste the verification token supplied by Search Console.
3. Run the workflow again. The build uses this optional value to override the existing public verification token in `src/layouts/Layout.astro`; configure the same variable in Cloudflare Pages when changing the production token.
4. In Search Console, submit `https://minikit.top/sitemap.xml`.

Production page-view analytics uses Cloudflare. Advertising remains disabled in the current configuration. AdSense integration is prepared; see `docs/ADSENSE-SETUP.md` before enabling it.

## Translation notes

All 50 dictionaries live in `src/i18n/locales/`; `src/i18n/catalog.json` defines language names, routes and text direction. Turkish uses the root route; the other languages use their locale code. These codes represent languages, not regional variants or a verified popularity ranking.

The versioned translations are drafts prepared from tool and interface copy; existing project translations are retained. They have not been reviewed by native speakers. Review each target market before treating the copy as final.

Builds and visitor sessions never call a translation provider. The build validates the full key set for every language and fails on missing/empty strings or unexpected HTML instead of silently omitting a language. All titles, descriptions, tool instructions, FAQs and runtime messages are stored locally. Updating English copy requires updating the corresponding dictionaries.

Supported languages:

Türkçe (`tr`), English (`en`), Español (`es`), Deutsch (`de`), Français (`fr`), Português (`pt`), Русский (`ru`), Italiano (`it`), العربية (`ar`), 简体中文 (`zh`), 日本語 (`ja`), हिन्दी (`hi`), Bahasa Indonesia (`id`), বাংলা (`bn`), اردو (`ur`), فارسی (`fa`), עברית (`he`), 한국어 (`ko`), Tiếng Việt (`vi`), ไทย (`th`), Bahasa Melayu (`ms`), Nederlands (`nl`), Polski (`pl`), Українська (`uk`), Română (`ro`), Magyar (`hu`), Čeština (`cs`), Ελληνικά (`el`), Svenska (`sv`), Dansk (`da`), Norsk (`no`), Suomi (`fi`), Български (`bg`), Српски (`sr`), Hrvatski (`hr`), Slovenčina (`sk`), Slovenščina (`sl`), Lietuvių (`lt`), Latviešu (`lv`), Eesti (`et`), தமிழ் (`ta`), తెలుగు (`te`), मराठी (`mr`), ગુજરાતી (`gu`), ಕನ್ನಡ (`kn`), മലയാളം (`ml`), ਪੰਜਾਬੀ (`pa`), Kiswahili (`sw`), Filipino (`fil`), Afrikaans (`af`).

## Before scaling traffic

- Connect Search Console and monitor indexing, queries and sitemap processing.
- Review translations and search intent for each market.
- Bilingual privacy and contact pages are published under `/privacy/` and `/contact/`. Keep their disclosures current when changing services.
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
tests/locales.test.mjs      Checks all 4,352 canonical pages and SEO links
public/
  favicon.svg
  robots.txt
```

## Production Cloudflare Pages deployment

1. Connect this GitHub repository to a Cloudflare Pages project.
2. `CF_PAGES=1` selects the production site/base automatically through `scripts/site-config.mjs`. For local production builds set `MINIKIT_DEPLOY_TARGET=cloudflare`.
3. Use Node.js 22.23.4 or newer (24.22.1 recommended), build command to `pnpm install --frozen-lockfile && pnpm run check && pnpm run build && pnpm run test:locales`, and output directory to `dist`.
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

## Advertising

AdSense configuration: `src/data/advertising.json`. No ad scripts, ad placeholders or third-party ad requests are rendered while disabled. A valid publisher ID enables meta-tag verification only; live ads require explicit activation, site approval, two real ad unit IDs, and a published Google CMP message. See `docs/ADSENSE-SETUP.md` for account setup and the root-level ads.txt requirement on GitHub project Pages. There are 4352 generated pages including privacy and contact.

## minikit.top / Cloudflare Pages

Cloudflare Pages builds (`CF_PAGES=1`) use `https://minikit.top/`; default local/GitHub builds retain the existing GitHub project base. Astro, localized pages and sitemap share `scripts/site-config.mjs`. To build/test the new domain locally, prefix commands with `MINIKIT_DEPLOY_TARGET=cloudflare`. Cloudflare Git integration: production branch `main`, build `pnpm run build`, output `dist`, Node 22.23.4 or newer and pnpm per packageManager. The domain uses the free plan. No server or paid hosting is required. Root `ads.txt` is included. DNS, domain activation, certificate and AdSense review must be verified separately.

### Additional image tools
Text watermarking exports PNG with adjustable position, opacity and size. The color palette tool samples at most 256 × 256 pixels and returns up to six quantized dominant HEX colors, ignoring mostly transparent pixels. Both accept the existing 20 MiB / 16-million-pixel limits. Image-to-Base64 accepts up to 5 MiB and preserves original bytes and metadata, returning a complete data URL. No image uploads occur. All three have 50-language UI and tool guide URLs.

### Local PDF tools
Images to PDF supports ordered JPEG/PNG/WebP images, A4 fitting or original pixel dimensions as PDF points. Raster conversion has a 100 MiB cumulative encoded-buffer budget. PDF merge preserves per-file page order; page extraction accepts selections such as `3,1-2` and deduplicates in selection order, producing one PDF. Limits: 20 images (20 MiB each), 10 PDFs, 50 MiB total inputs, 200 source PDF pages. Encrypted PDFs, forms, signed documents and portfolios are rejected; document-level features such as bookmarks and attachments are not copied. No OCR or PDF sanitization is offered. The locally bundled pdf-lib dependency loads only when a PDF operation starts. All 86 tools have 50-language UI; sitemap contains 4352 generated URLs.

### UUID, SHA-256 and Unix tools
UUID v4 supports batches of 1–100 using Web Crypto randomness. SHA-256 hashes up to 100,000 UTF-16 code units as UTF-8, preserving whitespace and normalization form and rejecting malformed surrogate input; it is not a file hash or password storage tool. Unix conversion is explicit UTC with seconds (up to3 fractional digits) or integer milliseconds, years0001–9999, negative/subsecond values and exact decimal parsing with BigInt. No device timezone is applied. Total: 86 tools and 4352 sitemap URLs.

### Additional text tools
Find-and-replace uses case-sensitive, non-overlapping literal matching and literal replacements (including dollar signs), with empty replacement allowed. Input is capped at 100,000 characters, search/replacement at 10,000 and output at 1,000,000. Line diff uses a bounded longest-common-subsequence comparison: max 500 lines/100,000 characters per input, CRLF/CR normalized to LF. It displays whole-line changes with color and plus/minus markers using inert DOM text. Line numbering includes empty/trailing rows, optional zero padding, max 10,000 lines and starting numbers 1 to 1,000,000,000. All inputs stay local.

### Calendar and countdown tools
Age uses completed years plus days since the last birthday, with 29 February observed on 28 February in non-leap years. Date difference uses UTC calendar ordinals, optional inclusive end day, and returns days/weeks/remainder without DST effects. Both accept years 0001 to 9999 and reject reversed dates. Countdown accepts a local device date/time, rejects nonexistent DST times and uses the earlier occurrence for repeated times. Remaining time is recomputed from Date.now, rounded up to whole seconds, and refreshed after visibility changes. Stop freezes the display; restart recalculates the same deadline. No background alarm/notification is scheduled.

### HTML entities, JWT viewing and number bases
HTML5 character-reference conversion uses locally bundled entities6.0.1, capped at100k input/2M output characters. Decoded markup remains textarea data; this is not sanitization. JWT viewing supports three compact unpadded Base64url segments with UTF-8 JSON objects and an alg string, including unsecured empty signatures; it never verifies signatures, expiration, issuer, audience or permissions. Five-part JWE is rejected. Original JSON lexemes are preserved by the formatter. No keys, remote JWKS fetches, token persistence or input uploads. Base conversion supports signed 4096-digit integers in bases2–36 using BigInt, no prefixes/fractions/separators, lowercase output and sign-magnitude negative formatting.

### Image effects and round avatars
Brightness adds brightness*2.55 to RGB after contrast scaling around128 by(100+contrast)/100; settings range -100..100 and channels clamp to0..255. Grayscale uses weighted RGB luminance(0.2126,0.7152,0.0722). Both preserve alpha and original dimensions. Round avatars use the maximal centered square, a circular alpha clip and128/256/512/1024pixel PNG output. All accept existing20MiB/16Mpixel/8192side raster limits and validate headers plus decoded bounds. Rendering is manual, always from an unchanged source canvas; setting/file changes invalidate outputs, and blob URLs are revoked. No file uploads or added dependencies.

### CSS and JSON/CSV converters
CSSO5.0.5 loads only on demand; rule restructuring is disabled, important bang comments are preserved, and CSS is never applied or imports fetched. The CSV parser handles quoted delimiters, escaped quotes, multiline fields, LF/CRLF/CR and optional initial BOM. Headers must be nonempty and unique, rows rectangular; empty physical records are not silently skipped. CSV to JSON preserves every cell as a string and uses prototype-free intermediate records. JSON to CSV accepts arrays of nonempty flat scalar objects, rejects duplicate keys, retains numeric token spelling, follows first-seen key order, quotes every cell and maps missing/null values to empty cells. Formula-prefix protection and UTF-8 BOM default on in the UI; protection intentionally changes strings and can be disabled. Bounds100k input/2M output chars,1000 data rows,100 columns,10000 data cells. UTF-8 downloads remain local.

Slug generation supports Turkish and Latin accent folding while retaining other Unicode letters/numbers. Reverse text uses Intl.Segmenter grapheme clusters; whitespace cleanup optionally preserves internal line breaks. All operate locally with a 100,000 UTF-16 code-unit input cap and reject malformed Unicode.

Discount computes savings/final price without taxes or fees, displayed to two decimals. Proportion solves exactly one missing A/B=C/D value with unique finite solutions and nonzero denominators. Travel supports km/m/mi, km/h/m/s/mph and hours/minutes/seconds at constant average speed. Inputs capped at absolute 1e12; proportion/travel output capped at 1e15 and displayed to 12 significant digits. Floating-point calculations are approximate.

Nine additional local tools: reading-time estimate (80–1000 wpm), top-100 word frequencies via Intl.Segmenter/page locale, cryptographic list selection without replacement, XML formatting (no DTD, 100k chars/10k nodes/100 levels; preserves mixed content/xml:space), HTTP(S) URL parsing without requests or credential output, and WCAG opaque sRGB text contrast using unrounded AA/AAA thresholds. Reference: https://www.w3.org/TR/WCAG22/#contrast-minimum . Image flip, outside border (0–512px) and transparent rounded corners (0–4096px, clamped to half-short-side) retain raster safeguards and download PNG, without metadata; animated inputs use one frame. Borders must also fit 8192-side/16M-pixel output limits. Text inputs max100k; picker max10k lines/100 picks, duplicate text on different lines may repeat.

PDF page editing adds relative clockwise rotation, complete unique page permutation and page deletion (cannot remove all pages), preserving existing PDF safeguards and lazy pdf-lib loading. JSON/YAML tools lazily load yaml2.9.1, reject aliases/anchors/custom tags/multiple documents/unsafe or decimal-precision-losing numbers and duplicate keys; JSON comparison ignores object order and compares array positions, returns JSON Pointer changes, max1000differences. Inputs100k/10kvalue nodes/depth100/output2M. Stopwatch uses a monotonic clock, Pomodoro wall-clock deadlines with manual phase switching/no audio/notifications; both reset on reload. Coin/six-sided dice use Web Crypto rejection sampling,1–100 independent outcomes.

Additional tools: combine1–10rasters (20MiB each/50MiB total/16M source and output pixels/8192side), Canvas blur0–50px, RGB inversion retaining alpha; PNG output without metadata. Regex runs in a disposable worker with1s timeout,1000pattern/100ktext/1000matches/2Moutput, UTF16indexes. Markdown parsing via marked18.1.1 in2s worker; strict allowlisted HTML preview in sandboxed srcdoc with default-src none, no scripts/styles/resources/active links. Turndown7.2.4 converts basic inert-template-cleanedHTML; tables/complexlayouts may lose formatting. Inputs100k/output2M, markup10knodes/depth100. Tip split, km/L100km fuel estimates and UTC calendar-day addition include bounds and rounding explanations; no live pricing. All computation stays local.

Audio trim/join/peak normalization use browser codecs and OfflineAudioContext resampling to44.1kHz, WAVPCM16 export without metadata; max20MiB/file,40MiBtotal,5joinfiles,120decodedseconds total,mono/stereo. Metadata checked before decode; source arrays immutable, mono duplicated forstereojoin, globalpeak target-12..0dBFS/silenceunchanged. Not perceptual loudness normalization. Prime/factor exactdecimal0or2..1e12; GCD/LCM signed100digitBigInt,zero conventions explicit. IPv4CIDR/IPv6compress-expand/IPinCIDR are strict localBigInt calculations, /31point-to-point and /32singleaddress, canonicalfirst-longestzero run>=2, mappedIPv6mixednotation, nozones/brackets/ports ornetworkrequests. References: https://www.rfc-editor.org/rfc/rfc3021.html , https://www.rfc-editor.org/rfc/rfc4291.html , https://www.rfc-editor.org/rfc/rfc5952.html .

Anagram/palindrome checks use NFC, locale lowercase and Intl.Segmenter grapheme groups, optional letter/number/mark filtering, no accent stripping and no empty filtered input. Email extraction scans bounded @ windows for practical ASCII/punycode forms (not full RFC validation/deliverability), first-seen order, domain-lowercase/local-case preserved and optional duplicate removal. Inputs100k,5000candidates,1000results; no partial result on overflow and no network requests.

## Quality and performance release (October 2026)

- Node 24.22.1 (`.node-version`), Astro 7, Tailwind 3 through PostCSS. CI reads `.node-version`. Ensure the Cloudflare dashboard runtime override, if present, also meets the package engine requirement (the preview build was verified on Node 22.23.4).
- Build with `MINIKIT_DEPLOY_TARGET=cloudflare pnpm run build`. The generation pipeline keeps full forms only as intermediate templates. Published homepages contain a searchable, categorized directory; tool pages contain exactly one form and up to four related links.
- Tool groups load only on their own pages. When adding a tool, update `src/data/tools.json` (including category), the setup registry in `src/scripts/app.ts`, translations, guide and browser coverage.
- HTML provides the 50-language hreflang links. `sitemap.xml` is an index of canonical-only child sitemaps, with at most 1,000 URLs per child. IndexNow follows the index before submitting URLs.
- `public/_headers` adds security headers and immutable hashed-asset caching on Cloudflare Pages. CSP is report-only so third-party advertising, workers and browser-generated previews can be checked before enforcement. Review console CSP reports when enabling advertising; the report-only policy does not block content.
- Domain redirects must be configured in Cloudflare Rules (host-based redirects are not supported by Pages `_redirects`). Preserve paths and query strings when redirecting www and the production pages.dev hostname to minikit.top; keep preview deployment hosts available for testing.
- Cloudflare Web Analytics already tracks page views by path. Separate tool URLs now make tool-page popularity meaningful. A page view is not proof of a completed tool operation; no new input, filename or tool-result telemetry has been added.

Verification:

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:tools
MINIKIT_DEPLOY_TARGET=cloudflare pnpm run build
MINIKIT_DEPLOY_TARGET=cloudflare pnpm run test:locales
pnpm exec playwright install chromium webkit
pnpm run test:browser
pnpm run audit:security
```

Browser tests run against a local-only static server and cover all isolated tool forms, search/category filters, mobile layout, RTL, keyboard order, language navigation, image downloads, cancellation, invalid-image cleanup, QR, JSON, HEX, PDF creation and dates. Set `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` to use installed Chrome locally, or `PLAYWRIGHT_BASE_URL` to verify an existing deployment. CI runs Chromium and WebKit before publishing legacy GitHub redirects. Weekly Dependabot checks cover package updates and monthly checks cover Actions.

Security overrides for esbuild and postcss-selector-parser select patched releases; review and remove overrides when upstream ranges include the fixes. `pnpm audit --prod` is a dependency advisory check, not proof that every potential vulnerability has been eliminated.

CI uses the official Microsoft Playwright image pinned by digest, with Chromium/WebKit and OS libraries already installed. This avoids installing 181 Ubuntu packages on every run. Keep its image version aligned with `@playwright/test` when upgrading. The browser suite has a 10-minute limit and the build job a 20-minute limit.

## MiniKit agent team

Seven project-scoped roles are defined in `.codex/agents/`: maintenance development, new-tool building, product research, SEO/content, UX/accessibility, analytics/growth, and quality/security. The coordinator selects roles for each task; at most three specialists run concurrently. Model and reasoning settings inherit from the coordinator; `.codex/config.toml` caps concurrent specialists at three. Read `AGENTS.md` and `docs/team/TEAM.md` for file ownership and verification rules. `docs/team/BACKLOG.md` records the current work. These profiles are reusable task definitions, not continuously running services or scheduled jobs. Open this repository as the project root for automatic custom-profile discovery; a parent-workspace coordinator can also load these instructions into specialist prompts.

## File SHA-256 checker

`/tools/file-sha256-checker/` hashes the original file bytes locally and optionally compares an expected 64-digit hexadecimal SHA-256 value. It supports one file up to 50 MiB, including empty files. The expected digest is trimmed and case-insensitive. A matching hash only confirms consistency with the supplied value; obtain that value from a trusted source. This is not malware detection or proof of publisher identity.

The browser reads the whole file into memory for Web Crypto; no file is uploaded and no dependency or API service is added. Changing a file, expected digest or clearing the form invalidates stale results. Crypto operations already in progress cannot be physically interrupted, but their stale results are discarded. Requires Web Crypto in a secure context. UI and the isolated tool page are available in all 50 languages.
