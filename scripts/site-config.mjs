/** Use one deployment target for Astro, locale generation and sitemap tests. */
export function getSiteConfig(env = process.env) {
 const cloudflare = env.MINIKIT_DEPLOY_TARGET === 'cloudflare' || env.CF_PAGES === '1';
 return cloudflare
  ? {site: 'https://minikit.top', base: '/'}
  : {site: 'https://bygog.github.io', base: '/minikit-tools'};
}
