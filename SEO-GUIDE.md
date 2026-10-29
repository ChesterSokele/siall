# SEO / AEO / GEO guide for sialllogistics.com

The site assumes the live address is **https://sialllogistics.com** (no `www`). If it is different, change `SITE` at the top of `tools/seo.mjs` and run `node tools/seo.mjs` again. It rewrites every canonical, sitemap and schema URL.

## 1. Go live checklist
1. Deploy the site so these open in a browser: `/sitemap.xml`, `/robots.txt`, `/llms.txt`.
2. Make `www.sialllogistics.com` redirect (301) to `sialllogistics.com` at your host or DNS, so there is only one version of the site.
3. Make sure HTTPS works.

## 2. Google Search Console (free)
1. Go to https://search.google.com/search-console and sign in with the Google account that will own the site.
2. Click **Add property** and choose **Domain**. Enter `sialllogistics.com`. This covers http, https and www.
3. Google shows a **TXT record**. Add it at your domain registrar or DNS host (Hostinger: Domains > DNS / Nameservers > add TXT record, host `@`). Wait a few minutes, then click **Verify**. (If you prefer, choose **URL prefix**, enter `https://sialllogistics.com/` and verify with the HTML tag or file method.)
4. **Submit the sitemap:** left menu **Sitemaps** > enter `sitemap.xml` > **Submit**. Status should say *Success* and show 17 discovered pages.
5. **Request indexing for the key pages:** paste each URL in the top bar, wait for the check, click **Request indexing**. Do these first: `/`, `/namibia-logistics-company.html`, `/logistics.html`, `/freight-forwarding-namibia.html`, `/customs-clearance-namibia.html`, `/faq.html`. (Google limits how many per day. Do the rest over the next days.)
6. **Check the results after 3 to 14 days:**
   - **Pages** report: how many pages are indexed and why others are not.
   - **Enhancements**: look for *FAQ*, *Breadcrumbs* and *Organization/Local business* items and fix any warnings.
   - **Performance**: the search queries people use to find you, with clicks and position.
7. Add other people under **Settings > Users and permissions** if needed.

## 3. Bing Webmaster Tools (feeds Bing, Copilot and helps ChatGPT search)
1. Go to https://www.bing.com/webmasters and choose **Import from Google Search Console**. It copies the site and the sitemap.
2. Optionally turn on **IndexNow** in Bing Webmaster Tools to push updates quickly.

## 4. Google Business Profile (most important for "near me" and Maps)
1. Go to https://business.google.com and create a profile named **SI All Logistics and Trading CC**.
2. Category: **Freight forwarding service** (add: Customs broker, Logistics service, Warehouse). Add address, phone +264 81 864 6905, website `https://sialllogistics.com`, opening hours, photos and services. Verify (postcard, phone or video).
3. Keep the name, address and phone **identical** everywhere (site, Facebook, LinkedIn, directories).
4. Ask real customers for Google reviews and reply to them.

## 5. AI search (ChatGPT, Gemini, Claude, Perplexity)
There is no submission form. AI tools pick sources that are crawlable, clear, consistent and mentioned elsewhere. What is already done in the code:
- `robots.txt` allows GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended and others.
- `llms.txt` gives AI tools a short summary and links to the key pages.
- Every page has JSON-LD (Organization, LocalBusiness, WebSite, WebPage, Breadcrumbs, Service, FAQPage) so facts are machine-readable.
- `faq.html` and each service page answer real questions in plain sentences, which is what AI assistants quote.

What you still need to do (off the website, this is what moves AI answers):
1. **Be mentioned elsewhere.** AI tools trust what several independent sites say. Create or complete profiles with the same name, address, phone and description: LinkedIn company page, Facebook, Instagram, X, YouTube, Google Business Profile, Bing Places, Apple Business Connect.
2. **Get listed** in Namibian and logistics directories: Namibia Chamber of Commerce and Industry (NCCI), Walvis Bay Corridor Group, Namibia Logistics Association or similar, Yellow Pages Namibia, Cylex, Hotfrog, Africa business directories.
3. **Get press and backlinks:** a press release on the "Namibia's #1" milestone, local news (The Namibian, New Era, Namibian Sun, Informanté), trade blogs, supplier and customer websites linking to you.
4. **Collect reviews** (Google, Facebook). Reviews feed AI answers and local ranking.
5. **Publish regularly.** One useful post or guide a month (for example "How long does clearing at Walvis Bay take", "Import duties on vehicles", "Walvis Bay to Zambia trucking") on topics customers ask.
6. After you create the social profiles, add their URLs to `sameAs` in the `ORG` block of `tools/seo.mjs`, then rebuild.
7. **Test it:** every month ask ChatGPT, Gemini, Claude and Perplexity "best logistics company in Namibia", "customs clearing agent Windhoek", "freight forwarder Walvis Bay" and note whether SI ALL appears and what they say.

## 6. About the "Namibia's number 1" claim
It is used across the site as requested. Search engines and customers trust claims they can check, and misleading advertising rules can apply to superlatives. Back it up on the site and elsewhere with something verifiable: number of shipments or clients, years in business, awards, certifications, customer reviews or testimonials. Then add those numbers to the About page and the home page.

## 7. Keeping it up to date
- Edit the page text in the HTML files, or the service pages' text in `tools/seo.mjs`.
- After adding or changing pages, run `node tools/seo.mjs` to refresh titles, schema, sitemap, robots and llms.txt, then deploy and resubmit the sitemap if you added pages.
- Add a real office street address, opening hours and social links to the schema when you have them.
