# SI All Logistics and Trading CC: Website

Static, dependency-free multi-page site (HTML, CSS, vanilla JS).

## Pages
- `index.html`: Home (logistics-led)
- `logistics.html`: freight, customs, road, air, warehousing
- `sports-apparel.html`: kit division
- `food-beverages.html`: food and beverage supply division
- `studio.html` (+ `studio.css`, `studio.js`): the Kit Studio, a full-screen game-style 3D kit selection screen (mannequin, categories, colours, logos, name/number)
- `careers.html`: open roles + online application form (CV and documents upload)
- `about.html`, `contact.html`
- `apply.php`: server-side handler for the careers form (PHP 8, no database)

## Files
- `styles.css`: design system (navy `#071a4d`, brand blue `#0a3d99`, orange `#ff6a0a`)
- `script.js`: menu, scroll effects, counters, corridor map, mode tabs, kit designer, contact form (mailto)
- `assets/logo.png`: official logo; `assets/favicon.svg`
- `assets/kit-viewer.js`: the 3D kit designer (built from `kit-viewer/`; three.js + the mannequin are bundled inside, so it works offline and from `file://`)
- `assets/photos/`: real product photos supplied by the client (kit, water, energy drink)
- `assets/placeholders/*.svg`: placeholder images still to be replaced with real photos (logistics, about, careers, contact, home service cards, call-to-action). Swap in photos under the same file names, or edit the `src` in the HTML. Stock-photo sites (e.g. iStock) are paid/licensed: buy or download the images yourself

## Run locally
    python3 -m http.server 8000          # everything except the careers form submission
    APPLY_MAIL_LOG=/tmp/mail.log php -S 127.0.0.1:8081   # also runs apply.php (writes the email to the log file instead of sending)

## Deploy
Upload the folder contents to a PHP-capable host (Hostinger `public_html`). The careers form needs PHP (`apply.php`); on a static-only host the
rest of the site works and the form tells applicants to email their CV instead.

### Careers form (`apply.php`)
- Emails each application (details + CV + supporting documents as attachments) to `HR_EMAIL` and stores nothing on the server.
- Edit the constants at the top of `apply.php`: `HR_EMAIL`, `FROM_EMAIL` (use an address on your own domain so the mail is not marked as spam), file limits, and the `ROLES` list.
- Protection: file type + real MIME check (PDF/DOC/DOCX/JPG/PNG), 5 MB per file, max 5 supporting documents, hidden honeypot field, minimum fill-in time, 5 applications per IP per hour.
- Roles are listed in `careers.html` (cards + the position dropdown) and in `ROLES` in `apply.php`. Keep the three in step when you change them.
- If your host caps uploads, check `upload_max_filesize` and `post_max_size` (needs at least 6 MB / 20 MB).

## TODO
- Client logo upload is processed in the browser only; it cannot be attached automatically to the mailto enquiry, so the form asks them to attach it. Connect a real form endpoint to accept file uploads.
- Add real photography (hero, products) when available; the kit viewer is real-time 3D, the rest are SVG illustrations
- Connect the contact form to a real endpoint (Formspree or similar)
- Review copy for the food and logistics pages (written from the brief, not from company material)

## 3D kit designer (`kit-viewer/`)
Source for `assets/kit-viewer.js`. A posed male mannequin wears fitted garment shells (shirt, shorts, socks): each is the body surface pushed out
by a fabric "ease", cut at the hem / sleeve / neckline, and shaded procedurally (fabric pattern, trim, collar, yoke, cuffs, side panels, stitching).
The 90mins+ brand logo (`models/90mins-logo.svg`) is fixed on every kit (left chest, hem, nape, shorts, socks). The team logo slot (right chest, shorts, one sock) shows a dashed "YOUR LOGO" box until the customer uploads their own. Logos, name and number are painted on canvases and projected onto the garments. Customer logos are uploaded in the browser and never leave it. The mannequin is headless and comes in six body types (Slim, Lean, Athletic, Muscular, Powerhouse, Stocky) plus a height slider. They are built in `tools/make-body.mjs` from MakeHuman macro targets plus extra muscle shaping, share one mesh, and are switched live.

    cd kit-viewer && npm install
    node tools/make-body.mjs   # models/base.obj + models/targets/* -> models/body.bin + src/landmarks.json
    node tools/make-logo.mjs   # models/90mins-logo.svg -> src/logo90.json
    npm run build              # -> ../assets/kit-viewer.js (esbuild)

Credits: body mesh and morph targets from MakeHuman (CC0); three.js (MIT); esbuild (MIT).
`kit-viewer/test.html` is a bare test page (serve the project root and open `/kit-viewer/test.html`).
