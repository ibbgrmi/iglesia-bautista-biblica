// Generates per-route HTML files with route-specific OG meta tags.
//
// Why: GH Pages serves whatever static file matches the URL path. If we put
// `dist/peticion.html` next to `dist/index.html`, GH serves `peticion.html`
// when someone visits /peticion, so the OG scraper sees that page's specific
// meta tags. The React app inside still boots and the router takes over.
//
// Add a new entry to PAGES to give another route its own social card.

import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const SITE = 'https://iglesia-bautista-biblica.org';

const PAGES = [
  {
    file:        'peticion.html',
    title:       'Tarjeta de Petición · Iglesia Bautista Bíblica',
    description: 'Comparte tu petición de oración. Estaremos orando por ti.',
    image:       `${SITE}/og-peticion.png`,
    url:         `${SITE}/peticion`,
    locale:      'es_US',
  },
  {
    file:        'petition.html',
    title:       'Prayer Request · Bible Baptist Church',
    description: "Share your prayer request with us. We'll be praying for you.",
    image:       `${SITE}/og-petition.png`,
    url:         `${SITE}/petition`,
    locale:      'en_US',
  },
];

function setMeta(html, prop, value) {
  // Handles both `property="..."` (OG) and `name="..."` (Twitter) attributes.
  const rxProp = new RegExp(`(<meta\\s+property="${prop}"\\s+content=")[^"]*(")`, 'i');
  const rxName = new RegExp(`(<meta\\s+name="${prop}"\\s+content=")[^"]*(")`, 'i');
  let out = html.replace(rxProp, `$1${value}$2`);
  if (out === html) out = html.replace(rxName, `$1${value}$2`);
  return out;
}

let count = 0;
for (const p of PAGES) {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${p.title}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"/i,
    `<meta name="description" content="${p.description}"`,
  );
  html = setMeta(html, 'og:url',             p.url);
  html = setMeta(html, 'og:title',           p.title);
  html = setMeta(html, 'og:description',     p.description);
  html = setMeta(html, 'og:image',           p.image);
  html = setMeta(html, 'og:locale',          p.locale);
  html = setMeta(html, 'twitter:title',       p.title);
  html = setMeta(html, 'twitter:description', p.description);
  html = setMeta(html, 'twitter:image',       p.image);
  fs.writeFileSync(path.join(dist, p.file), html);
  console.log(`✓ generated dist/${p.file}`);
  count++;
}
console.log(`postbuild: wrote ${count} route HTML page(s).`);
