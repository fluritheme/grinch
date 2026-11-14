import { mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const channel = pkg.private ? 'preview' : 'npm';
await mkdir('demo/public', { recursive: true });
await writeFile(
  'demo/public/robots.txt',
  'User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/\nDisallow: /internal/\nSitemap: https://grinch.fluri.xyz/sitemap.xml\n',
);
await writeFile(
  'demo/public/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://grinch.fluri.xyz/</loc></url></urlset>',
);
await writeFile(
  'demo/public/llms.txt',
  `# Grinch by Fluri\n\nA dependency-free holiday character for websites under the Fluri Themes Commercial License.\nCreated by František Gejdoš, founder of Fluri.\n\n- Demo and docs: https://grinch.fluri.xyz/\n- npm: https://www.npmjs.com/package/@fluritheme/grinch\n- Source: https://github.com/fluritheme/grinch\n- License: https://fluri.xyz/license/\n- Earlier versions through 0.1.1 remain MIT.\n- All themes: https://fluri.xyz/\n- Founder: https://fluri.xyz/founder/\n\nHe sneaks along element edges, steals drawn presents, hides behind cards, reacts to pointers, and returns gifts in kindness mode. Canvas rendering, TypeScript, zero network requests from the runtime. Supports React, Vue and vanilla JavaScript. Respects reduced motion. Version ${pkg.version}.\n`,
);
await writeFile(
  'demo/public/grinch-mark.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 15 3 12l8 1 5-3 5 3 8-1-3 3 3 4-5 1-2 7-6 3-6-3-2-7-5-1Z" fill="#79ad30"/><path d="m6 12 3-8q8-7 17 2l-4 4Z" fill="#bd3d4c"/><path d="M6 12h17M10 20q6 7 12-1" fill="none" stroke="#f6eddb" stroke-width="2"/><circle cx="13" cy="17" r="1" fill="#f6eddb"/><circle cx="20" cy="17" r="1" fill="#f6eddb"/><circle cx="26" cy="6" r="3" fill="#f6eddb"/></svg>',
);
await writeFile(
  'demo/public/favicon.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1f6544"/><path d="M13 20l19-9 19 9-5 24-14 10-14-10Z" fill="#79ad30" stroke="#153629" stroke-width="3"/><path d="M20 29l9 3m6 0 9-3M23 41q9 9 18-2" fill="none" stroke="#153629" stroke-width="3"/></svg>',
);
await writeFile(
  'demo/public/npm-version.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="24" role="img" aria-label="${channel} ${pkg.version}"><rect width="112" height="24" rx="4" fill="#153629"/><path d="M43 0h65q4 0 4 4v16q0 4-4 4H43" fill="#c92c42"/><g fill="#fff5df" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle"><text x="23" y="16">${channel}</text><text x="77" y="16">v${pkg.version}</text></g></svg>`,
);
await cp('assets/readme', 'demo/public/readme', { recursive: true });
const html = await readFile('demo/index.html', 'utf8');
const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
if (!json) throw Error('Missing structured data');
const hash = createHash('sha256').update(json).digest('base64');
const worker = await readFile('workers/site.ts', 'utf8');
await writeFile('workers/site.ts', worker.replace(/sha256-[^']+/, `sha256-${hash}`));
