// SEO / AEO / GEO build step. Run from the repo root:  node tools/seo.mjs
// - writes the <head> SEO block (title, description, canonical, Open Graph, Twitter, JSON-LD) into every page
// - generates the service, guide and FAQ pages
// - writes sitemap.xml, robots.txt and llms.txt
// Change SITE below if the live domain differs, then run it again.
import fs from 'fs';

const SITE = 'https://sialllogistics.com';
const TODAY = new Date().toISOString().slice(0, 10);
const NAME = 'SI All Logistics and Trading CC';
const BRAND = 'SI ALL Logistics';
const TAG = "Namibia's #1 logistics company";
const EMAIL = 'info@sialllogistics.com';
const PHONE = '+264818646905';
const OG = SITE + '/assets/og-image.jpg';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = f => fs.readFileSync(f, 'utf8');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------------- shared JSON-LD ---------------- */
const ORG = {
  '@type': ['Organization', 'LocalBusiness'], '@id': SITE + '/#organization',
  name: NAME, alternateName: [BRAND, 'SI ALL', 'SIALL Logistics', 'SI All Logistics Namibia'],
  url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/assets/logo.png' }, image: OG,
  description: `${NAME} is ${TAG}: a Windhoek-based freight forwarding, customs clearance, sea, air and road freight, warehousing and last-mile delivery company, with sports apparel and food and beverage supply divisions.`,
  slogan: 'Connecting markets. Delivering value.', email: EMAIL, telephone: PHONE,
  address: { '@type': 'PostalAddress', streetAddress: 'Olympia', postOfficeBoxNumber: '4567', addressLocality: 'Windhoek', addressRegion: 'Khomas', addressCountry: 'NA' },
  areaServed: [{ '@type': 'Country', name: 'Namibia' }, { '@type': 'AdministrativeArea', name: 'Southern African Development Community (SADC)' }],
  knowsAbout: ['Freight forwarding', 'Customs clearance', 'Sea freight Walvis Bay', 'Air freight', 'Road freight', 'Cross-border trucking', 'Warehousing', 'Import and export Namibia', 'Last-mile delivery', 'Custom sports kits', 'Food and beverage supply'],
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: PHONE, email: EMAIL, areaServed: 'NA', availableLanguage: ['English'] }],
};
const WEBSITE = { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: BRAND, alternateName: NAME, inLanguage: 'en-NA', publisher: { '@id': SITE + '/#organization' } };

/* ---------------- existing pages ---------------- */
const EXISTING = {
  'index.html': { path: '/', title: `SI ALL Logistics | ${TAG}, Windhoek`, desc: `${TAG}: freight forwarding, customs clearance, sea, air and road freight, warehousing and delivery from Windhoek, Namibia.`, crumbs: [] },
  'logistics.html': { path: '/logistics.html', title: 'Logistics Services in Namibia: Freight, Customs, Warehousing | SI ALL', desc: 'Sea, air and road freight, customs clearance, warehousing and last-mile delivery across Namibia and the SADC region. One team, one point of contact. Request a quote.', crumbs: [['Logistics', '/logistics.html']] },
  'sports-apparel.html': { path: '/sports-apparel.html', title: 'Custom Soccer Kits & Sports Apparel in Namibia | SI ALL', desc: 'Design custom football kits in Namibia: jersey, shorts and socks with your colours, logo, name and number, delivered in 15 days. Try our free 3D Kit Studio.', crumbs: [['Sports Apparel', '/sports-apparel.html']] },
  'studio.html': { path: '/studio.html', title: 'Kit Studio: Design Your Football Kit in 3D | SI ALL Namibia', desc: 'Free 3D football kit designer. Pick colours, collar, pattern, logo, name and number, see it on a mannequin, save it as an image and request a quote.', crumbs: [['Sports Apparel', '/sports-apparel.html'], ['Kit Studio', '/studio.html']] },
  'food-beverages.html': { path: '/food-beverages.html', title: 'Wholesale Food & Beverage Supply in Namibia | SI ALL', desc: 'Bulk food and beverage supply for retailers, caterers and events in Namibia, including 90mins+ Hydrate sparkling water and Energy Buzzo energy drink.', crumbs: [['Food & Beverages', '/food-beverages.html']] },
  'about.html': { path: '/about.html', title: `About SI ALL Logistics | ${TAG}`, desc: `About ${NAME}, a Windhoek-based logistics and trading company and ${TAG}. Freight, customs, apparel and food supply.`, crumbs: [['About', '/about.html']] },
  'careers.html': { path: '/careers.html', title: 'Careers at SI ALL Logistics | Jobs in Windhoek, Namibia', desc: 'Join Namibia\'s #1 logistics company. See open roles at SI All Logistics and Trading CC in Windhoek and apply online with your CV and documents.', crumbs: [['Careers', '/careers.html']] },
  'contact.html': { path: '/contact.html', title: 'Contact & Get a Quote | SI ALL Logistics Windhoek', desc: `Request a freight, customs or supply quote from ${NAME}, Windhoek. Call +264 81 864 6905, WhatsApp or email ${EMAIL}.`, crumbs: [['Contact', '/contact.html']] },
};

/* ---------------- new pages ---------------- */
const SERVICE_LINKS = [
  ['freight-forwarding-namibia.html', 'Freight forwarding'], ['customs-clearance-namibia.html', 'Customs clearance'],
  ['sea-freight-walvis-bay.html', 'Sea freight via Walvis Bay'], ['air-freight-windhoek.html', 'Air freight'],
  ['road-freight-namibia.html', 'Road freight & cross-border trucking'], ['warehousing-windhoek.html', 'Warehousing'],
  ['import-export-guide-namibia.html', 'Import & export guide'], ['faq.html', 'FAQ'],
];
const SERVICES = [
  {
    slug: 'freight-forwarding-namibia.html', short: 'Freight forwarding', service: 'Freight forwarding',
    title: 'Freight Forwarding in Namibia | SI ALL Logistics, Windhoek',
    desc: 'Door-to-door freight forwarding in Namibia: sea, air and road, with customs, documents and delivery handled by one Windhoek team. Get an itemised quote in N$.',
    h1: ['Freight', 'forwarding', 'in', 'Namibia.'], eyebrow: 'Freight forwarding', photo: 'cargoship', alt: 'Containers being loaded for freight forwarding in Namibia',
    lead: 'Import, export and in-country freight, planned and tracked by one team so nothing falls between carriers, customs and your warehouse.',
    about: ['Freight forwarding means arranging the movement of your goods from origin to destination: choosing the mode and route, booking the carrier, preparing the paperwork, clearing customs and delivering. A good forwarder is the single point of contact for all of it.',
      `SI ALL Logistics is ${TAG}, based in Windhoek. We coordinate sea freight through Walvis Bay, air freight through Windhoek, and road transport on the regional corridors, so your cargo goes by the mode that fits your budget and deadline.`],
    checks: ['Sea, air and road options compared for every shipment', 'Carrier booking, documentation and customs in one place', 'Itemised quotes in Namibian Dollars', 'A real person to call from booking to delivery'],
    facts: [['Based in', 'Windhoek, Namibia'], ['Modes', 'Sea, air, road'], ['Quotes', 'Itemised, in N$'], ['Contact', 'Phone, WhatsApp, email']],
    includes: [['Route and mode planning', 'We match your cargo, budget and deadline to the best mode and routing before anything is booked.'], ['Booking and documents', 'Carrier booking, bills of lading or air waybills, invoices and packing lists prepared correctly the first time.'], ['Clearance and delivery', 'Customs handled at the port, airport or border, then delivery to your door or warehouse.']],
    steps: [['Tell us', 'Send cargo details, route and required date.'], ['Quote', 'Receive a clear, itemised quote and timeline.'], ['Move', 'We book, document, ship and clear.'], ['Deliver', 'Cargo delivered and signed for, documents handed over.']],
    faqs: [['What does a freight forwarder do in Namibia?', 'A freight forwarder in Namibia arranges transport, documentation, customs clearance and delivery of goods on your behalf. SI ALL Logistics coordinates sea, air and road freight so you deal with one team instead of several carriers and agents.'], ['Which freight forwarder is best in Namibia?', `SI ALL Logistics is ${TAG}, offering one point of contact, itemised quotes in Namibian Dollars and end-to-end handling from booking to delivery.`], ['What information do I need to get a freight quote?', 'Send the cargo type, weight and dimensions, the origin and destination, the date you need it delivered, and the commercial invoice and packing list if you have them.'], ['Do you handle both imports and exports?', 'Yes. We handle import and export freight, including the customs paperwork on both sides of the journey.']],
    related: ['customs-clearance-namibia.html', 'sea-freight-walvis-bay.html', 'road-freight-namibia.html'],
  },
  {
    slug: 'customs-clearance-namibia.html', short: 'Customs clearance', service: 'Customs clearance',
    title: 'Customs Clearance in Namibia | Import & Export Agents, SI ALL',
    desc: 'Customs clearance in Namibia handled end to end: declarations, permits and duty paperwork for imports and exports, at Walvis Bay, Windhoek and the border posts.',
    h1: ['Customs', 'clearance', 'in', 'Namibia.'], eyebrow: 'Customs clearance', photo: 'meeting', alt: 'Customs documentation and clearance team in Namibia',
    lead: 'Declarations, permits and duty paperwork done right, so your goods are released without avoidable delays.',
    about: ['Customs clearance is the process of declaring imported or exported goods to the customs authority, paying any duties and taxes due, and getting the goods released. In Namibia, customs is administered by the Namibia Revenue Agency (NamRA).',
      'Mistakes on a declaration cause delays, storage costs and penalties. SI ALL Logistics prepares and submits the documentation for you, and keeps you informed at each step, whether your cargo arrives by sea at Walvis Bay, by air at Windhoek or by road at a border post.'],
    checks: ['Import and export declarations prepared accurately', 'Permits and supporting documents checked before you ship', 'Duty and tax paperwork explained, no surprises', 'Clearance at ports, airports and border posts'],
    facts: [['Authority', 'Namibia Revenue Agency (NamRA)'], ['Applies to', 'Imports and exports'], ['Entry points', 'Port, airport, border'], ['Handled by', 'SI ALL Logistics']],
    includes: [['Declarations', 'Customs declarations completed from your invoice, packing list and transport documents.'], ['Permits and compliance', 'We flag when an import or export permit or certificate is needed, before the cargo moves.'], ['Duties and release', 'Duty and tax paperwork handled and the cargo released and moved on to delivery.']],
    steps: [['Documents', 'You send the invoice, packing list and transport document.'], ['Declare', 'We prepare and submit the customs declaration.'], ['Pay and clear', 'Duties and taxes settled, goods cleared.'], ['Release', 'Cargo released and delivered onward.']],
    faqs: [['What documents are needed for customs clearance in Namibia?', 'Typically a commercial invoice, packing list and a bill of lading or air waybill, plus any import permits or certificates the goods require. SI ALL Logistics checks your documents before shipping so clearance is not held up.'], ['Who handles customs in Namibia?', 'Customs in Namibia is administered by the Namibia Revenue Agency (NamRA). A clearing agent such as SI ALL Logistics prepares and submits declarations on your behalf.'], ['Can you clear goods at Walvis Bay?', 'Yes. We coordinate customs clearance for sea cargo arriving at Walvis Bay, as well as air cargo at Windhoek and road cargo at border posts.'], ['How long does customs clearance take?', 'It depends on the goods, the completeness of the documents and any inspections. Accurate paperwork is the biggest factor, which is why we check documents before shipment.']],
    related: ['import-export-guide-namibia.html', 'sea-freight-walvis-bay.html', 'freight-forwarding-namibia.html'],
  },
  {
    slug: 'sea-freight-walvis-bay.html', short: 'Sea freight', service: 'Sea freight',
    title: 'Sea Freight via Walvis Bay, Namibia | SI ALL Logistics',
    desc: 'Container and break-bulk sea freight through Walvis Bay, Namibia: booking, tracking, port handling and customs coordinated by one team. Request a quote.',
    h1: ['Sea', 'freight', 'via', 'Walvis', 'Bay.'], eyebrow: 'Sea freight', photo: 'cargoship', alt: 'Container ship for sea freight through Walvis Bay',
    lead: 'Container and break-bulk shipments through Namibia\'s main port, with booking, tracking and port handling coordinated for you.',
    about: ['Walvis Bay is Namibia\'s main commercial port and the gateway for sea cargo to Namibia and onward into the region. Sea freight is the most economical way to move heavy, bulky and non-urgent cargo.',
      'SI ALL Logistics books the space, prepares the shipping documents, coordinates port handling and customs clearance, and arranges the road leg from Walvis Bay to Windhoek or to your final destination.'],
    checks: ['Full container (FCL) and consolidated (LCL) loads', 'Break-bulk and project cargo on request', 'Port handling and customs coordinated', 'Onward road delivery from Walvis Bay'],
    facts: [['Port', 'Walvis Bay, Namibia'], ['Cargo', 'Containers, break-bulk'], ['Best for', 'Heavy, bulky, non-urgent'], ['Onward', 'Road delivery included']],
    includes: [['Booking and tracking', 'Space booked with the shipping line and your cargo tracked until it arrives.'], ['Port and customs', 'Port handling and customs clearance coordinated so the container is released quickly.'], ['Inland delivery', 'Trucking from the port to Windhoek, your warehouse or the border for cross-border cargo.']],
    steps: [['Plan', 'Choose container type, route and sailing.'], ['Book and document', 'Booking confirmed and shipping documents prepared.'], ['Clear at port', 'Customs and port formalities completed.'], ['Deliver', 'Road delivery to your door.']],
    faqs: [['Do you ship through Walvis Bay?', 'Yes. SI ALL Logistics coordinates container and break-bulk shipments through Walvis Bay, including port handling, customs clearance and onward delivery.'], ['What is the difference between FCL and LCL?', 'FCL (full container load) means you use a whole container for your cargo. LCL (less than container load) means your goods share a container with others, which suits smaller shipments.'], ['When should I choose sea freight over air freight?', 'Choose sea freight for heavy, bulky or non-urgent cargo where cost matters most. Choose air freight when speed matters more than cost.'], ['Can you deliver from Walvis Bay to Windhoek?', 'Yes. We arrange road transport from Walvis Bay to Windhoek and other destinations as part of the same shipment.']],
    related: ['customs-clearance-namibia.html', 'road-freight-namibia.html', 'freight-forwarding-namibia.html'],
  },
  {
    slug: 'air-freight-windhoek.html', short: 'Air freight', service: 'Air freight',
    title: 'Air Freight in Windhoek, Namibia | Urgent Cargo, SI ALL',
    desc: 'Air freight from and to Windhoek, Namibia for urgent and high-value cargo, with collection, customs and final delivery arranged at both ends. Get a quote.',
    h1: ['Air', 'freight', 'from', 'Windhoek.'], eyebrow: 'Air freight', photo: 'cargoplane', alt: 'Cargo aircraft for air freight to and from Windhoek',
    lead: 'Urgent and high-value cargo moved by air, with collection and final delivery arranged at both ends.',
    about: ['Air freight is the fastest way to move goods, and the right choice for urgent, perishable or high-value cargo. In Namibia, international air cargo is handled through Hosea Kutako International Airport near Windhoek.',
      'SI ALL Logistics arranges the collection, air booking, documents, customs clearance and the final delivery, so a single team is accountable for the whole journey.'],
    checks: ['Time-critical and high-value cargo', 'Fast, predictable transit', 'Collection and delivery handled for you', 'Customs clearance included'],
    facts: [['Airport', 'Hosea Kutako International (Windhoek)'], ['Best for', 'Urgent, high-value goods'], ['Speed', 'Fastest mode'], ['Handled by', 'SI ALL Logistics']],
    includes: [['Collection', 'Pick-up from your supplier or premises and delivery to the airport.'], ['Booking and documents', 'Air waybill and commercial documents prepared and checked.'], ['Clearance and delivery', 'Customs cleared at arrival and cargo delivered to the consignee.']],
    steps: [['Request', 'Send cargo details and the deadline.'], ['Book', 'Flight booked and documents prepared.'], ['Clear', 'Customs handled at the airport.'], ['Deliver', 'Final delivery to the consignee.']],
    faqs: [['Do you offer air freight in Namibia?', 'Yes. SI ALL Logistics arranges air freight for urgent and high-value cargo to and from Windhoek, including collection, customs clearance and final delivery.'], ['When is air freight worth the cost?', 'Air freight is worth it when speed matters: urgent spare parts, perishable goods, high-value items or tight deadlines.'], ['Can you collect the cargo from my supplier?', 'Yes. We can arrange collection and delivery to the airport as part of the shipment.'], ['What do I need to send for an air freight quote?', 'Cargo type, weight and dimensions, origin and destination, and the date you need it delivered.']],
    related: ['customs-clearance-namibia.html', 'freight-forwarding-namibia.html', 'sea-freight-walvis-bay.html'],
  },
  {
    slug: 'road-freight-namibia.html', short: 'Road freight', service: 'Road freight',
    title: 'Road Freight & Cross-Border Trucking in Namibia | SI ALL',
    desc: 'Road freight and cross-border trucking across Namibia and the SADC region, with scheduled runs, firm delivery windows and a direct line to dispatch.',
    h1: ['Road', 'freight', 'across', 'Namibia.'], eyebrow: 'Road freight', photo: 'cargotruck', alt: 'Truck on a road freight run in Namibia',
    lead: 'Cross-border and local trucking on the main regional corridors, planned to firm delivery windows.',
    about: ['Road freight carries most goods within Namibia and between Namibia and its neighbours. It is flexible, door-to-door and well suited to regional deliveries and the last leg of imports arriving by sea or air.',
      'SI ALL Logistics plans loads and scheduled runs, coordinates border formalities for cross-border cargo, and gives you a direct line to dispatch so you always know where your goods are.'],
    checks: ['Local and cross-border trucking', 'Flexible loads and scheduled runs', 'Border documentation coordinated', 'Direct line to dispatch'],
    facts: [['Coverage', 'Namibia and SADC corridors'], ['Best for', 'Regional and last-mile'], ['Loads', 'Part and full loads'], ['Dispatch', 'Direct phone line']],
    includes: [['Load planning', 'The right vehicle and schedule for your cargo and delivery window.'], ['Border handling', 'Cross-border paperwork and clearance coordinated with the carrier.'], ['Live updates', 'Direct contact with dispatch so you know where your cargo is.']],
    steps: [['Plan', 'Load, route and delivery window agreed.'], ['Collect', 'Cargo collected and loaded.'], ['Cross and clear', 'Border formalities handled if needed.'], ['Deliver', 'Delivered and signed for.']],
    faqs: [['Do you do cross-border trucking from Namibia?', 'Yes. SI ALL Logistics coordinates cross-border road freight on the main regional corridors, including the border paperwork. Ask us about your specific route.'], ['Can you deliver within Namibia?', 'Yes. We run local and national deliveries from Windhoek, including last-mile delivery to businesses and customers.'], ['Do you handle part loads?', 'Yes. We can plan part loads as well as full truck loads, depending on the route and schedule.'], ['How do I track my road shipment?', 'You have a direct line to our dispatch team by phone or WhatsApp for updates throughout the journey.']],
    related: ['freight-forwarding-namibia.html', 'warehousing-windhoek.html', 'sea-freight-walvis-bay.html'],
  },
  {
    slug: 'warehousing-windhoek.html', short: 'Warehousing', service: 'Warehousing and consolidation',
    title: 'Warehousing & Distribution in Windhoek | SI ALL Logistics',
    desc: 'Short-term warehousing, sorting, consolidation and last-mile delivery in Windhoek, Namibia. Store, consolidate and distribute with one logistics partner.',
    h1: ['Warehousing', 'in', 'Windhoek.'], eyebrow: 'Warehousing', photo: 'insidewarehouse', alt: 'Inside a warehouse in Windhoek used for storage and consolidation',
    lead: 'Short-term storage, sorting and consolidation in Windhoek, linked directly to your freight and final delivery.',
    about: ['Warehousing gives your cargo a safe place to wait between arrival and delivery, or to be sorted, consolidated and split into smaller deliveries. It is especially useful for importers who receive large shipments and distribute them in stages.',
      'Because SI ALL Logistics handles the freight and the delivery too, your goods move from the port or airport into storage and out to customers without handovers between companies.'],
    checks: ['Short-term storage and sorting', 'Consolidation of multiple suppliers', 'Split deliveries and last-mile distribution', 'Linked to freight and customs'],
    facts: [['Location', 'Windhoek, Namibia'], ['Stay', 'Short-term'], ['Services', 'Store, sort, consolidate'], ['Delivery', 'Last-mile included']],
    includes: [['Storage', 'Secure short-term storage for cargo arriving by sea, air or road.'], ['Consolidation', 'Combine goods from several suppliers into fewer shipments, or split a large one.'], ['Last-mile delivery', 'Final delivery to your customers, shops or sites.']],
    steps: [['Receive', 'Cargo received and checked in.'], ['Store', 'Held safely until you need it.'], ['Pick and pack', 'Orders sorted and prepared.'], ['Deliver', 'Delivered to the final destination.']],
    faqs: [['Do you offer warehousing in Windhoek?', 'Yes. SI ALL Logistics offers short-term warehousing, sorting and consolidation in Windhoek, together with last-mile delivery.'], ['Can you consolidate shipments from different suppliers?', 'Yes. We can combine cargo from several suppliers and deliver it as a single shipment, or split a large shipment into several deliveries.'], ['Is storage linked to customs clearance?', 'Yes. Because we also handle freight and clearance, your goods can move from the port or airport into storage with the paperwork already in order.'], ['Do you deliver from the warehouse?', 'Yes. Last-mile delivery to your customers, shops or sites is part of the service.']],
    related: ['road-freight-namibia.html', 'freight-forwarding-namibia.html', 'customs-clearance-namibia.html'],
  },
];

const PAGES = {}; // slug -> {path,title,desc,crumbs,type,schema extras}

/* ---------------- html pieces ---------------- */
function headBlock(file, p) {
  const url = SITE + p.path;
  const crumbs = [['Home', '/'], ...(p.crumbs || [])];
  const graph = [ORG, WEBSITE];
  graph.push({ '@type': p.webType || 'WebPage', '@id': url + '#webpage', url, name: p.title, description: p.desc, inLanguage: 'en-NA', isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#organization' }, primaryImageOfPage: { '@type': 'ImageObject', url: p.image || OG }, dateModified: TODAY });
  if (crumbs.length > 1) graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE + c[1] })) });
  if (p.service) graph.push({ '@type': 'Service', '@id': url + '#service', name: p.service, serviceType: p.service, provider: { '@id': SITE + '/#organization' }, areaServed: { '@type': 'Country', name: 'Namibia' }, description: p.desc, url });
  if (p.faqs) graph.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: p.faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) });
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  return `<!-- seo:start -->
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en-na" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="author" content="${NAME}">
  <meta name="geo.region" content="NA-KH"><meta name="geo.placename" content="Windhoek, Namibia">
  <meta property="og:type" content="${p.path === '/' ? 'website' : 'article'}">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:locale" content="en_NA">
  <meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(p.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${p.image || OG}">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(NAME)}: ${esc(TAG)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(p.title)}">
  <meta name="twitter:description" content="${esc(p.desc)}">
  <meta name="twitter:image" content="${p.image || OG}">
  <link rel="apple-touch-icon" href="${SITE}/assets/logo.png">
  <script type="application/ld+json">${ld}</script>
  <!-- seo:end -->`;
}

function applyHead(html, file, p) {
  html = html.replace(/\s*<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, '');
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/, '').replace(/\s*<meta name="description"[^>]*>/, '');
  return html.replace(/(<meta name="viewport"[^>]*>)/, '$1\n  ' + headBlock(file, p));
}

function footerSeo() {
  return `<nav class="footer-seo" aria-label="Logistics services in Namibia"><strong>${TAG}.</strong> ${SERVICE_LINKS.map(l => `<a href="${l[0]}">${esc(l[1])}</a>`).join('')}</nav>\n      `;
}
function addFooterSeo(html) {
  if (html.includes('footer-seo')) return html.replace(/<nav class="footer-seo"[\s\S]*?<\/nav>\s*/, footerSeo());
  return html.replace('<div class="footer-bottom">', footerSeo() + '<div class="footer-bottom">');
}

const words = a => a.map((w, i) => `<span class="w"><span${i >= a.length - 2 ? ' class="hl"' : ''} style="--i:${i}">${esc(w)}</span></span>`).join(' ');
const faqHtml = (faqs, title = 'Frequently asked questions') => `
    <section class="section">
      <div class="container">
        <div class="section-head reveal"><span class="eyebrow">FAQ</span><h2>${esc(title)}</h2></div>
        <div class="faq">${faqs.map(f => `<details class="faq-item reveal"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</div>
      </div>
    </section>`;
const ctaHtml = svc => `
    <section class="section" style="padding-top:0">
      <div class="cta reveal">
        <h2>Need a quote? Talk to ${esc(TAG.replace("Namibia's", "Namibia's"))}.</h2>
        <p>Tell us what you are moving. We reply with a clear quote and a realistic timeline.</p>
        <div class="hero-actions"><a class="btn" href="contact.html?service=${encodeURIComponent(svc || 'Logistics')}">Request a quote ${ARROW}</a><a class="btn btn-ghost" href="https://wa.me/264818646905" rel="noopener">WhatsApp us</a></div>
      </div>
    </section>`;

function shell(indexHtml, p, bodyMain, page = 'logistics') {
  const top = indexHtml.slice(indexHtml.indexOf('<a class="skip"'), indexHtml.indexOf('<main id="main">'));
  const bottom = indexHtml.slice(indexHtml.indexOf('<div class="stripe">'));
  const head = `<!doctype html>
<html lang="en-NA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#030b26">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>document.documentElement.classList.add("js")</script>
</head>
<body data-page="${page}">
  `;
  let html = head + top + '<main id="main">' + bodyMain + '\n  </main>\n  ' + bottom;
  html = applyHead(html, '', p);
  return addFooterSeo(html);
}

function hero(p, crumbHtml) {
  return `
    <section class="hero page-hero">
      <div class="container">
        <div class="crumbs">${crumbHtml}</div>
        <span class="eyebrow">${esc(p.eyebrow)}</span>
        <h1>${words(p.h1)}</h1>
        <p class="lead">${esc(p.lead)}</p>
        <div class="hero-actions"><a class="btn" href="contact.html?service=${encodeURIComponent(p.service || 'Logistics')}">Request a quote ${ARROW}</a><a class="btn btn-ghost" href="tel:${PHONE}">Call +264 81 864 6905</a></div>
        ${p.photo ? `<figure class="hero-photo"><img src="assets/photos/${p.photo}.webp" alt="${esc(p.alt)}" width="900" height="640" loading="eager"></figure>` : ''}
      </div>
    </section>`;
}

function servicePage(index, s) {
  const crumbs = [['Logistics', '/logistics.html'], [s.short, '/' + s.slug]];
  const meta = { path: '/' + s.slug, title: s.title, desc: s.desc, crumbs, service: s.service, faqs: s.faqs };
  PAGES[s.slug] = meta;
  const rel = s.related.map(r => { const o = SERVICES.find(x => x.slug === r) || { slug: r, short: 'Import & export guide', lead: 'A plain-English guide to moving goods into and out of Namibia.' }; return `<article class="feature reveal"><h3>${esc(o.short)}</h3><p>${esc(o.lead)}</p><p><a href="${o.slug}">Learn more about ${esc(o.short.toLowerCase())} &rarr;</a></p></article>`; }).join('');
  const main = hero(s, `<a href="index.html">Home</a> / <a href="logistics.html">Logistics</a> / ${esc(s.short)}`) + `
    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">Overview</span>
          <h2>${esc(s.short)} by ${esc(TAG.replace("Namibia's #1 logistics company", "Namibia's #1 logistics company"))}.</h2>
          ${s.about.map(t => `<p>${esc(t)}</p>`).join('')}
          <ul class="checks">${s.checks.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          <a class="btn" href="contact.html?service=${encodeURIComponent(s.service)}">Request a quote ${ARROW}</a>
        </div>
        <div class="panel reveal"><h3>At a glance</h3><div class="kv">${s.facts.map(f => `<div><span>${esc(f[0])}</span><strong>${esc(f[1])}</strong></div>`).join('')}</div></div>
      </div>
    </section>
    <section class="section section-sky">
      <div class="container">
        <div class="section-head reveal"><span class="eyebrow">What is included</span><h2>${esc(s.short)}, step by step.</h2></div>
        <div class="grid3">${s.includes.map(i => `<article class="feature reveal"><h3>${esc(i[0])}</h3><p>${esc(i[1])}</p></article>`).join('')}</div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-head center reveal"><span class="eyebrow">Process</span><h2>How it works.</h2></div>
        <div class="timeline">${s.steps.map(t => `<div class="step reveal"><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p></div>`).join('')}</div>
      </div>
    </section>` + faqHtml(s.faqs) + `
    <section class="section section-sky">
      <div class="container">
        <div class="section-head reveal"><span class="eyebrow">Related</span><h2>More logistics services in Namibia.</h2></div>
        <div class="grid3">${rel}</div>
      </div>
    </section>` + ctaHtml(s.service);
  return shell(index, meta, main);
}

/* ---------- long-form pages ---------- */
const GUIDE_FAQ = [
  ['What do I need to import goods into Namibia?', 'In general you need a commercial invoice, a packing list, a transport document (bill of lading or air waybill), a customs declaration and any permits or certificates the goods require. Requirements vary by product, so confirm with your clearing agent or the Namibia Revenue Agency (NamRA) before you ship.'],
  ['Which port is used for sea freight into Namibia?', 'Walvis Bay is Namibia\'s main commercial port and the usual entry point for sea cargo.'],
  ['Do I need a clearing agent to import into Namibia?', 'Most importers use a clearing agent or freight forwarder because it avoids declaration errors and delays. SI ALL Logistics can handle the full process for you.'],
  ['Can SI ALL Logistics help me export from Namibia?', 'Yes. We arrange export freight, documentation and customs clearance, and can coordinate transport to the destination.'],
];
function guidePage(index) {
  const p = { path: '/import-export-guide-namibia.html', title: 'How to Import & Export in Namibia: Step-by-Step Guide | SI ALL', desc: 'A practical guide to importing and exporting in Namibia: documents, customs, Walvis Bay, air and road freight, and how to avoid delays. By SI ALL Logistics, Windhoek.', crumbs: [['Logistics', '/logistics.html'], ['Import & export guide', '/import-export-guide-namibia.html']], faqs: GUIDE_FAQ, webType: 'Article' };
  PAGES['import-export-guide-namibia.html'] = p;
  const hp = { eyebrow: 'Guide', h1: ['Import', '&', 'export', 'in', 'Namibia.'], lead: 'A plain-English guide to moving goods into and out of Namibia, from documents to delivery.', photo: 'meeting', alt: 'Importers and exporters reviewing shipping documents' };
  const main = hero(hp, '<a href="index.html">Home</a> / <a href="logistics.html">Logistics</a> / Import &amp; export guide') + `
    <section class="section">
      <div class="container prose reveal">
        <p class="answer"><strong>Short answer:</strong> to import or export in Namibia you choose a transport mode, prepare the commercial documents, submit a customs declaration to the Namibia Revenue Agency (NamRA), pay any duties and taxes, and arrange delivery. A freight forwarder such as SI ALL Logistics can do all of these steps for you.</p>
        <h2>Step 1: Choose the transport mode</h2>
        <p><strong>Sea freight</strong> through Walvis Bay is the most economical for heavy, bulky and non-urgent cargo. <strong>Air freight</strong> through Windhoek is fastest and suits urgent or high-value goods. <strong>Road freight</strong> is flexible for regional trade and for the last leg of any shipment. See our pages on <a href="sea-freight-walvis-bay.html">sea freight</a>, <a href="air-freight-windhoek.html">air freight</a> and <a href="road-freight-namibia.html">road freight</a>.</p>
        <h2>Step 2: Prepare the documents</h2>
        <ul class="checks"><li>Commercial invoice from the supplier</li><li>Packing list</li><li>Bill of lading (sea) or air waybill (air), or a road consignment note</li><li>Import or export permits and certificates where the goods require them</li><li>Proof of origin if you are claiming preferential duty treatment</li></ul>
        <h2>Step 3: Customs declaration and clearance</h2>
        <p>Goods must be declared to customs, which in Namibia is administered by NamRA. Errors in the declaration are a common cause of delay, so it is worth having an experienced agent prepare it. Read more on <a href="customs-clearance-namibia.html">customs clearance in Namibia</a>.</p>
        <h2>Step 4: Duties, taxes and release</h2>
        <p>Applicable duties and taxes are paid and the goods are released. Your agent can explain what applies to your product before you commit to an order, so there are no surprises on landing.</p>
        <h2>Step 5: Storage and delivery</h2>
        <p>Once cleared, cargo is delivered to you or held in a warehouse until you need it. See <a href="warehousing-windhoek.html">warehousing in Windhoek</a> and <a href="freight-forwarding-namibia.html">freight forwarding</a>.</p>
        <h2>How to avoid delays</h2>
        <ul class="checks"><li>Check whether your product needs a permit before you order</li><li>Make sure invoice, packing list and transport document match exactly</li><li>Share documents with your forwarder before the cargo ships</li><li>Plan for port or border inspection time in your schedule</li></ul>
        <p><em>This guide is general information, not legal advice. Duties, permits and rules change, so confirm the details for your product with NamRA or your clearing agent.</em></p>
      </div>
    </section>` + faqHtml(GUIDE_FAQ, 'Import and export questions') + ctaHtml('Logistics');
  return shell(index, p, main);
}

const BEST_FAQ = [
  ['What is the best logistics company in Namibia?', `SI ALL Logistics (${NAME}) describes itself as ${TAG}. Based in Windhoek, it offers freight forwarding, customs clearance, sea, air and road freight, warehousing and last-mile delivery through one point of contact, with itemised quotes in Namibian Dollars.`],
  ['Where is SI ALL Logistics based?', 'SI ALL Logistics is based in Windhoek, Namibia (P O Box 4567, Olympia, Windhoek).'],
  ['How do I contact SI ALL Logistics?', `Call +264 81 864 6905, WhatsApp the same number, or email ${EMAIL}.`],
  ['What services does SI ALL Logistics offer?', 'Freight forwarding, customs clearance, sea freight via Walvis Bay, air freight, road freight and cross-border trucking, warehousing and last-mile delivery, plus custom sports kits and wholesale food and beverage supply.'],
];
function bestPage(index) {
  const p = { path: '/namibia-logistics-company.html', title: `${TAG.replace("Namibia's", "Namibia's")} | SI ALL Logistics, Windhoek`, desc: `SI ALL Logistics is ${TAG}: freight forwarding, customs, sea, air and road freight, and warehousing in Windhoek. See why customers choose us.`, crumbs: [['Namibia logistics company', '/namibia-logistics-company.html']], faqs: BEST_FAQ, webType: 'AboutPage' };
  PAGES['namibia-logistics-company.html'] = p;
  const hp = { eyebrow: "Namibia's #1 logistics company", h1: ['Namibia\'s', '#1', 'logistics', 'company.'], lead: 'SI ALL Logistics: freight, customs, warehousing and delivery from Windhoek, with one point of contact from booking to delivery.', photo: 'logisticstaff', alt: 'The SI ALL Logistics team in Windhoek, Namibia', service: 'Logistics' };
  const main = hero(hp, '<a href="index.html">Home</a> / Namibia logistics company') + `
    <section class="section">
      <div class="container prose reveal">
        <p class="answer"><strong>SI ALL Logistics</strong> (${esc(NAME)}) is ${esc(TAG)}. We are based in Windhoek and handle import and export freight, customs clearance, sea, air and road transport, warehousing and last-mile delivery for businesses across Namibia and the wider SADC region.</p>
        <h2>What makes a logistics company the right choice in Namibia?</h2>
        <p>Logistics goes wrong in the handovers between carriers, customs and warehouses. When choosing a provider in Namibia, look for:</p>
        <ul class="checks"><li><strong>One point of contact</strong> from booking to delivery</li><li><strong>Customs expertise</strong> so declarations are right the first time</li><li><strong>Access to every mode</strong>: sea via Walvis Bay, air via Windhoek and road corridors</li><li><strong>Clear, itemised pricing</strong> in Namibian Dollars</li><li><strong>Local presence</strong> and a real person you can phone or WhatsApp</li></ul>
        <p>That is how SI ALL Logistics works, and it is why we aim to be the first company Namibian businesses think of for logistics.</p>
        <h2>Our logistics services</h2>
        <div class="grid3 tight">${SERVICES.map(s => `<article class="feature"><h3>${esc(s.short)}</h3><p>${esc(s.lead)}</p><p><a href="${s.slug}">${esc(s.short)} in Namibia &rarr;</a></p></article>`).join('')}</div>
        <h2>More from SI ALL</h2>
        <p>Beyond logistics we run two supply divisions: <a href="sports-apparel.html">custom sports apparel</a>, including a free <a href="studio.html">3D Kit Studio</a>, and <a href="food-beverages.html">wholesale food and beverage supply</a>.</p>
        <h2>Contact SI ALL Logistics</h2>
        <p>Phone or WhatsApp <a href="tel:${PHONE}">+264 81 864 6905</a>, email <a href="mailto:${EMAIL}">${EMAIL}</a>, or <a href="contact.html">request a quote online</a>. Office: P O Box 4567, Olympia, Windhoek, Namibia.</p>
      </div>
    </section>` + faqHtml(BEST_FAQ, `About ${BRAND}`) + ctaHtml('Logistics');
  return shell(index, p, main, 'about');
}

const FAQ_GROUPS = [
  ['About SI ALL Logistics', BEST_FAQ],
  ['Freight, customs and delivery', [
    ['What does a freight forwarder do in Namibia?', 'A freight forwarder arranges transport, documentation, customs clearance and delivery of goods on your behalf. SI ALL Logistics coordinates sea, air and road freight through one team.'],
    ['Do you ship through Walvis Bay?', 'Yes. We coordinate container and break-bulk shipments through Walvis Bay, including port handling, customs clearance and onward delivery.'],
    ['Do you handle customs clearance in Namibia?', 'Yes. We prepare and submit import and export declarations and coordinate clearance at ports, airports and border posts.'],
    ['Do you offer cross-border trucking?', 'Yes. We coordinate cross-border road freight on the main regional corridors, including border paperwork.'],
    ['Do you offer warehousing in Windhoek?', 'Yes. We offer short-term warehousing, sorting, consolidation and last-mile delivery in Windhoek.'],
    ['What do I need to send to get a quote?', 'Cargo type, weight and dimensions, the origin and destination, the delivery date you need, and the invoice and packing list if you have them.'],
    ['Are your quotes in Namibian Dollars?', 'Yes. Quotes are itemised in Namibian Dollars (N$), with clear deposit and balance terms.'],
  ]],
  ['Sports apparel and Kit Studio', [
    ['Can I design a custom football kit in Namibia?', 'Yes. Use the free 3D Kit Studio to pick colours, collar, pattern, logo, name and number, then request a quote from SI ALL.'],
    ['How long does a custom kit take?', 'Custom soccer kits are delivered in 15 days.'],
    ['Can I save my kit design?', 'Yes. The Save look button in Kit Studio downloads a picture of your design to your computer or phone.'],
  ]],
  ['Food and beverages', [
    ['Do you supply food and beverages wholesale?', 'Yes. We supply bulk food and beverages to retailers, caterers and events in Namibia, including 90mins+ Hydrate sparkling water and Energy Buzzo energy drink.'],
  ]],
];
function faqPage(index) {
  const all = FAQ_GROUPS.flatMap(g => g[1]);
  const p = { path: '/faq.html', title: 'FAQ: Logistics, Customs & Freight in Namibia | SI ALL', desc: 'Answers to common questions about freight forwarding, customs clearance, Walvis Bay shipping, warehousing, sports kits and food supply from SI ALL Logistics, Windhoek.', crumbs: [['FAQ', '/faq.html']], faqs: all, webType: 'FAQPage_PAGE' };
  PAGES['faq.html'] = p;
  const hp = { eyebrow: 'FAQ', h1: ['Your', 'questions,', 'answered.'], lead: 'Quick, direct answers about shipping, customs and our services in Namibia.' };
  const main = hero(hp, '<a href="index.html">Home</a> / FAQ') + FAQ_GROUPS.map(g => faqHtml(g[1], g[0])).join('') + ctaHtml('Logistics');
  p.webType = 'WebPage';
  // FAQPage graph node is generated from p.faqs; the visible questions above match it exactly.
  return shell(index, p, main);
}

/* ---------------- run ---------------- */
let index = read('index.html');

// home page content: positioning line + internal links to the service pages (idempotent)
index = index.replace(/<span class="eyebrow">Logistics &middot; Windhoek, Namibia<\/span>/, `<span class="eyebrow">${esc(TAG)} &middot; Windhoek</span>`);
const homeSection = `<!-- seo-home:start -->
    <section class="section">
      <div class="container">
        <div class="section-head reveal"><span class="eyebrow">${esc(TAG)}</span><h2>Logistics services across Namibia.</h2><p>SI ALL Logistics is ${esc(TAG)}. From Walvis Bay to Windhoek and across the region, our team handles every step so your cargo arrives on time.</p></div>
        <div class="grid3">${SERVICES.map(s => `<article class="feature reveal"><h3>${esc(s.short)}</h3><p>${esc(s.lead)}</p><p><a href="${s.slug}">${esc(s.short)} in Namibia &rarr;</a></p></article>`).join('')}</div>
        <p class="seo-more reveal"><a href="namibia-logistics-company.html">Why choose SI ALL</a> &middot; <a href="import-export-guide-namibia.html">Import &amp; export guide</a> &middot; <a href="faq.html">FAQ</a></p>
      </div>
    </section>
    <!-- seo-home:end -->
    `;
index = index.replace(/<!-- seo-home:start -->[\s\S]*?<!-- seo-home:end -->\s*/, '');
const ctaIdx = index.lastIndexOf('<section class="section" style="padding-top:0">');
index = index.slice(0, ctaIdx) + homeSection + index.slice(ctaIdx);
fs.writeFileSync('index.html', index);

for (const [f, p] of Object.entries(EXISTING)) {
  let html = f === 'index.html' ? index : read(f);
  html = addFooterSeo(applyHead(html, f, f === 'logistics.html' ? { ...p, service: 'Logistics services', webType: 'WebPage' } : p));
  fs.writeFileSync(f, html);
}
for (const s of SERVICES) fs.writeFileSync(s.slug, servicePage(index, s));
fs.writeFileSync('import-export-guide-namibia.html', guidePage(index));
fs.writeFileSync('namibia-logistics-company.html', bestPage(index));
fs.writeFileSync('faq.html', faqPage(index));

/* sitemap, robots, llms */
const urls = [...Object.values(EXISTING).map(p => p.path), ...Object.values(PAGES).map(p => p.path)];
const prio = u => (u === '/' ? '1.0' : /namibia-logistics-company|logistics\.html|freight|customs|sea-|air-|road-|warehous/.test(u) ? '0.9' : '0.7');
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${prio(u)}</priority></url>`).join('\n')}
</urlset>
`);
const bots = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'cohere-ai'];
fs.writeFileSync('robots.txt', `# SI All Logistics and Trading CC: search and AI crawlers are welcome
User-agent: *
Allow: /
Disallow: /apply.php
Disallow: /kit-viewer/

${bots.map(b => `User-agent: ${b}\nAllow: /\n`).join('\n')}
Sitemap: ${SITE}/sitemap.xml
`);
const page = (u, t, d) => `- [${t}](${SITE}${u}): ${d}`;
fs.writeFileSync('llms.txt', `# ${NAME} (SI ALL Logistics)

> ${NAME} is ${TAG}. Based in Windhoek, it provides freight forwarding, customs clearance, sea freight via Walvis Bay, air freight, road freight and cross-border trucking, warehousing and last-mile delivery across Namibia and the SADC region. It also runs a custom sports apparel division (with a free 3D Kit Studio) and a wholesale food and beverage supply division.

Contact: ${EMAIL} | +264 81 864 6905 (phone and WhatsApp) | P O Box 4567, Olympia, Windhoek, Namibia

## Logistics services
${SERVICES.map(s => page('/' + s.slug, s.short, s.lead)).join('\n')}

## Guides and answers
${page('/namibia-logistics-company.html', 'Namibia logistics company', `Why SI ALL is ${TAG}`)}
${page('/import-export-guide-namibia.html', 'Import and export guide', 'Step-by-step guide to importing and exporting in Namibia')}
${page('/faq.html', 'FAQ', 'Answers about freight, customs, warehousing, sports kits and food supply')}

## Other divisions
${page('/sports-apparel.html', 'Sports apparel', 'Custom football kits delivered in 15 days')}
${page('/studio.html', 'Kit Studio', 'Free 3D football kit designer')}
${page('/food-beverages.html', 'Food and beverages', 'Wholesale food and beverage supply in Namibia')}

## Company
${page('/about.html', 'About', 'About SI All Logistics and Trading CC')}
${page('/contact.html', 'Contact', 'Request a quote')}
${page('/careers.html', 'Careers', 'Open roles in Windhoek')}
`);
console.log('SEO build done:', urls.length, 'URLs in sitemap');
