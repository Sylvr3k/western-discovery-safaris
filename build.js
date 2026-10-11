// Usage: node build.js
// Reads packages.js (data) + package.template.html (a copy of your current package.html)
// Writes one static HTML file per package, plus sitemap.xml, into the same folder.

const fs = require('fs');
const path = require('path');

const SITE = 'https://westerndiscoverysafaris.com'; // change if your domain differs
const DIR = __dirname;

// ---- load data from packages.js ----
const code = fs.readFileSync(path.join(DIR, 'packages.js'), 'utf8');
const { WA, P, tours, field } = new Function(code + '; return {WA,P,tours,field};')();
const all = [...tours, ...field];

// ---- helpers (ported from the browser script) ----
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const stripTags = s => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const trim = (s, n) => {
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, '') + '…';
};

const bullets = (a, depth = 0) => `<ul class="${depth ? 'list-[disc] mt-1' : 'list-disc'} pl-5 pt-3 pb-3 space-y-1 marker:text-secondary">${
  [].concat(a).map(i => typeof i === 'string'
    ? `<li>${i}</li>`
    : `<li>${i.t}${i.sub ? bullets(i.sub, depth + 1) : ''}</li>`
  ).join('')
}</ul>`;

const li = (a, icon = 'check_box') => a.map(x => `<li class="flex items-start gap-2"><span class="material-symbols-outlined text-secondary text-[16px] mt-0.5">${icon}</span><span class="text-on-surface-variant">${x}</span></li>`).join('');

const label = 'font-label-sm text-label-sm uppercase tracking-widest font-bold';

// ---- page body for one package ----
function renderMain(p) {
  const msg = encodeURIComponent(`Hello Western Discovery Safaris, I am interested in the "${p.n}" (${p.price} per person). Please send availability.`);

  const others = all.filter(x => x.id !== p.id).map(x => `
    <a href="${x.id}.html" class="block bg-[#F7F2E4] border border-primary/25 rounded-DEFAULT p-4 shadow-sm hover:border-secondary transition-all">
      <span class="font-headline-sm text-headline-sm text-primary font-bold block">${x.n}</span>
      <span class="font-label-sm text-label-sm text-on-surface-variant block mt-1">${x.len} &middot; ${x.price} USD per person</span>
    </a>`).join('');

  const stayBlock = `
<div class="bg-[#EDE4CE] border border-primary/25 border-l-4 border-l-secondary rounded-DEFAULT p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5 mt-8">
  <span class="material-symbols-outlined text-[#8C6A28] text-[36px] shrink-0">bed</span>
  <div class="flex-1">
    <span class="font-label-sm text-label-sm uppercase tracking-widest text-[#8C6A28] font-bold">Optional Extra</span>
    <h2 class="font-headline-sm text-headline-sm text-primary font-bold mt-1 mb-2">Accommodation in Kigoma</h2>
    <p class="font-body-md text-body-md text-on-surface-variant">Need a place to stay before or after your trek? We can arrange accommodation in Kigoma at an additional cost. Tell us your preferences and budget, and we'll take care of the booking.</p>
  </div>
  <a href="https://wa.me/${WA}?text=${encodeURIComponent('Hello, I would like help arranging accommodation in Kigoma for the "' + p.n + '".')}"
     target="_blank" rel="noopener"
     class="shrink-0 text-center bg-primary hover:bg-secondary text-[#F9F5EC] font-label-sm text-label-sm px-4 py-3 rounded-DEFAULT tracking-wider uppercase font-bold transition-colors">
    Ask about stays
  </a>
</div>`;

  return `
  <div class="mb-8 border-b border-primary/20 pb-6">
    <div class="inline-flex items-center gap-2 mb-2">
      <span class="${label} text-secondary">Trip Details</span>
      <span class="text-primary/40">•</span>
      <span class="font-label-sm text-label-sm text-on-surface-variant">Departing from Kigoma</span>
    </div>
    <h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">${p.n}</h1>
  </div>

  <div class="relative mb-10">
    <div class="aspect-[16/8] rounded-DEFAULT overflow-hidden border border-primary/20">
      <img src="${P}${p.img}" alt="${esc(p.alt)}" class="w-full h-full object-cover" fetchpriority="high">
    </div>
    <span class="absolute top-3 left-3 bg-primary-container/90 text-[#F9F5EC] font-label-sm text-label-sm px-2.5 py-1 rounded-DEFAULT tracking-widest uppercase">${p.len}</span>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
    <div class="lg:col-span-8">
      <p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-10">${p.d}</p>

      <div class="bg-[#F7F2E4] border border-primary/25 rounded-DEFAULT p-5 sm:p-7 shadow-sm mb-8">
        <div class="border-b border-primary/15 pb-4 mb-5">
          <span class="${label} text-[#8C6A28]">Itinerary</span>
        </div>
        <ol class="space-y-5 border-l-2 border-secondary/40 ml-1.5">
          ${p.it.map(x => `
         <li class="relative pl-6">
          <span class="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-secondary border-2 border-[#F7F2E4]"></span>
          <h3 class="font-headline-sm text-headline-sm text-primary font-bold">${x[0]}</h3>
          <div class="font-body-md text-body-md text-on-surface-variant">${bullets(x[1])}</div>
        </li>`).join('')}
        </ol>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="bg-[#EDE4CE] border-l-2 border-secondary rounded-DEFAULT p-5">
          <h2 class="${label} text-primary mb-3">Included</h2>
          <ul class="space-y-2 font-body-sm text-body-sm">${li(p.inc)}</ul>
        </div>
        <div class="bg-[#EDE4CE] border-l-2 border-primary/30 rounded-DEFAULT p-5">
          <h2 class="${label} text-primary mb-3">Not included</h2>
          <ul class="space-y-2 font-body-sm text-body-sm">${li(p.exc, 'cancel')}</ul>
        </div>
      </div>
     ${p.stay ? stayBlock : ''}
    </div>

    <aside class="lg:col-span-4 lg:sticky lg:top-28 bg-[#F7F2E4] border border-primary/25 rounded-DEFAULT p-5 sm:p-7 shadow-sm">
      <div class="border-b border-primary/15 pb-4 mb-5 flex items-center justify-between gap-2">
        <span class="${label} text-[#8C6A28]">Per person</span>
        <span class="font-label-sm text-label-sm bg-[#EFE5CD] px-2.5 py-1 rounded-DEFAULT border border-primary/10">${p.len}</span>
      </div>
      <p class="font-headline-md text-headline-md text-primary font-bold mb-5">${p.price} <span class="font-label-md text-label-md text-on-surface-variant">USD</span></p>

      <a href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener"
         class="block text-center bg-primary hover:bg-secondary text-[#F9F5EC] font-label-sm text-label-sm px-4 py-3 rounded-DEFAULT tracking-wider uppercase font-bold transition-colors mb-3">
        Ask about this trip on WhatsApp
      </a>
      <a href="index.html#inquiry"
         class="block text-center border border-primary/40 text-primary hover:bg-primary hover:text-[#F9F5EC] font-label-sm text-label-sm px-4 py-3 rounded-DEFAULT tracking-wider uppercase font-bold transition-colors">
        Send an inquiry
      </a>

      <div class="bg-[#EDE4CE] border-l-2 border-secondary rounded-DEFAULT p-3 mt-5">
        <span class="font-label-sm text-label-sm uppercase font-bold text-primary block">Ready to meet the chimps and discover Kigoma? Book your adventure today.</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant">Tip: Pack comfortable hiking shoes, long sleeves, a hat, insect repellent and a light rain jacket.</p>
      </div>
    </aside>
  </div>

  <div class="mt-16 mb-4 border-b border-primary/20 pb-4">
    <span class="${label} text-secondary">Other trips</span>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${others}</div>`;
}

// ---- head tags (title, description, canonical, social, structured data) ----
function renderHead(p) {
  const title = `${p.n} | Western Discovery Safaris`;
  const desc = trim(stripTags(p.s), 155);
  const url = `${SITE}/${p.id}.html`;
  const img = `${SITE}/${P}${p.img}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: p.n,
    description: stripTags(p.s),
    image: img,
    url,
    touristType: 'Wildlife and nature travellers',
    provider: { '@type': 'TravelAgency', name: 'Western Discovery Safaris', url: SITE },
    offers: {
      '@type': 'Offer',
      price: p.price.replace(/[^0-9.]/g, ''),
      priceCurrency: 'USD',
      url
    }
  };
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ---- build ----
const tplPath = path.join(DIR, 'package.template.html');
if (!fs.existsSync(tplPath)) {
  console.error('Missing package.template.html. Copy your current package.html to that name first.');
  process.exit(1);
}
const tpl = fs.readFileSync(tplPath, 'utf8');
const year = new Date().getFullYear();

const checks = [
  [/<title>[\s\S]*?<\/title>/, 'title'],
  [/<main id="app"[^>]*><\/main>/, 'main#app'],
  [/<script src="packages\.js"><\/script>\s*<script>[\s\S]*?<\/script>/, 'packages.js + inline script']
];
checks.forEach(([re, name]) => {
  if (!re.test(tpl)) { console.error(`Template is missing expected part: ${name}`); process.exit(1); }
});

all.forEach(p => {
  const html = tpl
    .replace(/<title>[\s\S]*?<\/title>/, () => renderHead(p))
    .replace(/<main id="app"[^>]*><\/main>/, () => `<main id="app" class="max-w-[1380px] mx-auto px-gutter md:px-margin py-10">${renderMain(p)}\n</main>`)
    .replace(/<script src="packages\.js"><\/script>\s*<script>[\s\S]*?<\/script>/, '')
    .replace('<span id="year"></span>', String(year))
    .replace('<a class="flex items-center gap-3 group" href="#">', '<a class="flex items-center gap-3 group" href="index.html">');
  fs.writeFileSync(path.join(DIR, `${p.id}.html`), html);
  console.log('wrote', `${p.id}.html`);
});

// ---- sitemap (home + packages). Add any other pages you have. ----
const today = new Date().toISOString().slice(0, 10);
const urls = [`${SITE}/`, ...all.map(p => `${SITE}/${p.id}.html`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIR, 'sitemap.xml'), sitemap);
console.log('wrote sitemap.xml');
