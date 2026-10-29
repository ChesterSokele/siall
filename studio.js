(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- data ---------- */
  var PALETTE = [
    ["Black", "#17181b"], ["Charcoal", "#3a3f4a"], ["White", "#ffffff"], ["Silver", "#b9bfca"], ["Royal blue", "#0a3d99"], ["Navy", "#071a4d"],
    ["Sky blue", "#3aa0ff"], ["Teal", "#0e8c8c"], ["Red", "#d62839"], ["Maroon", "#6d1020"], ["Orange", "#ff6a0a"], ["Gold", "#f2b705"],
    ["Neon yellow", "#e6f01d"], ["Green", "#0f8a4b"], ["Purple", "#6a2fb0"], ["Violet", "#7b45e0"], ["Pink", "#ff4fa3"], ["Sand", "#d9c7a0"]
  ];
  var NAMES = {}; PALETTE.forEach(function (c) { NAMES[c[1]] = c[0]; });
  var PRESETS = [
    { n: "Night Shift", shirt: "#17181b", trim: "#e6f01d", shorts: "#17181b", pat: "checker", collar: "vneck", trimPat: "ornament" },
    { n: "Violet Crown", shirt: "#7b45e0", trim: "#ffffff", shorts: "#7b45e0", pat: "stripes", collar: "crew", trimPat: "ornament" },
    { n: "Royal", shirt: "#0a3d99", trim: "#ffffff", shorts: "#071a4d", pat: "stripes", collar: "polo", trimPat: "plain" },
    { n: "Crimson", shirt: "#d62839", trim: "#ffffff", shorts: "#17181b", pat: "checker", collar: "vneck", trimPat: "ornament" },
    { n: "Pitch", shirt: "#0f8a4b", trim: "#f2b705", shorts: "#0f8a4b", pat: "plain", collar: "crew", trimPat: "plain" },
    { n: "Sky", shirt: "#3aa0ff", trim: "#ffffff", shorts: "#ffffff", pat: "stripes", collar: "crew", trimPat: "ornament" },
    { n: "Sunset", shirt: "#ff6a0a", trim: "#071a4d", shorts: "#071a4d", pat: "checker", collar: "polo", trimPat: "ornament" },
    { n: "Stealth", shirt: "#3a3f4a", trim: "#ff6a0a", shorts: "#17181b", pat: "checker", collar: "vneck", trimPat: "plain" }
  ];
  var DEFAULT = Object.assign({ number: "10", name: "PLAYER", customerMode: "none", body: "athletic", height: 178 }, PRESETS[0]);

  /* ---------- state ---------- */
  var state = Object.assign({}, DEFAULT, { customer: null, colors: {} });
  var logoData = null, activeCat = "sets", ready = false;

  function lum(h) { var n = parseInt(h.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  function legible(bg) { return Math.abs(lum(state.trim) - lum(bg)) > 60 ? state.trim : (lum(bg) > 150 ? "#0b1634" : "#ffffff"); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  var KEYS = ["shirt", "trim", "shorts", "pat", "collar", "trimPat", "number", "name", "customerMode", "body"];
  var BODIES = [
    { id: "athletic", n: "Athletic", d: "Typical pro footballer", sw: 19, ww: 11, ar: 4.6, lg: 5.8 },
    { id: "stocky", n: "Stocky", d: "Solid, fuller frame", sw: 19, ww: 16, ar: 5.0, lg: 6.6 }
  ];
  function pack() { var o = {}; KEYS.forEach(function (k) { o[k] = state[k]; }); o.height = state.height; o.customerMode = "none"; return o; }
  function unpack(o) {
    if (!o || typeof o !== "object") return false;
    var ok = false;
    KEYS.forEach(function (k) { if (typeof o[k] === "string") { state[k] = o[k]; ok = true; } });
    if (o.height) state.height = o.height;
    ["shirt", "trim", "shorts"].forEach(function (k) { if (!/^#[0-9a-f]{6}$/i.test(state[k])) state[k] = DEFAULT[k]; });
    state.number = String(state.number).replace(/\D/g, "").slice(0, 2); state.name = String(state.name).toUpperCase().slice(0, 12);
    if (["checker", "stripes", "plain"].indexOf(state.pat) < 0) state.pat = "checker";
    if (["vneck", "crew", "polo"].indexOf(state.collar) < 0) state.collar = "vneck";
    if (["ornament", "plain"].indexOf(state.trimPat) < 0) state.trimPat = "ornament";
    state.customerMode = "none";
    if (!BODIES.some(function (b) { return b.id === state.body; })) state.body = DEFAULT.body;
    state.height = Math.max(165, Math.min(195, parseInt(o.height, 10) || DEFAULT.height));
    return ok;
  }

  /* ---------- small helpers ---------- */
  var toastT; function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 1800); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function presetIndex() {
    for (var i = 0; i < PRESETS.length; i++) { var p = PRESETS[i]; if (p.shirt === state.shirt && p.trim === state.trim && p.shorts === state.shorts && p.pat === state.pat && p.collar === state.collar && p.trimPat === state.trimPat) return i; }
    return -1;
  }
  function jerseyIcon(shirt, trim) {
    return '<svg viewBox="0 0 64 56" aria-hidden="true"><path d="M20 4l8 3c2 4 6 4 8 0l8-3 14 12-8 8-5-4v34H19V20l-5 4-8-8z" fill="' + shirt + '" stroke="rgba(0,0,0,.25)"/>' +
      '<path d="M28 7c2 4 6 4 8 0l3 2c-2 7-12 7-14 0z" fill="' + trim + '"/><path d="M6 16l8 8 3-3-8-8zM58 16l-8 8-3-3 8-8z" fill="' + trim + '"/><path d="M20 4l8 3-3 6-9 0z M44 4l-8 3 3 6 9 0z" fill="' + trim + '" opacity=".95"/></svg>';
  }
  var ICON = {
    sets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    shirt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3L3 6l2 5 3-1v11h8V10l3 1 2-5-5-3c-1 2-7 2-8 0z"/></svg>',
    trim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4"/></svg>',
    shorts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l1 16h-6l-2-9-2 9H4z"/></svg>',
    fabric: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h6v6H3zM15 3h6v6h-6zM9 9h6v6H9zM3 15h6v6H3zM15 15h6v6h-6z"/></svg>',
    logos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l6-3 6 3-1 5-2-1v8H9v-8l-2 1z"/></svg>',
    name: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h6"/><path d="M17 12l3 5-3 0"/></svg>'
  };
  var CATS = [
    { id: "sets", label: "Kit sets", focus: "full", sub: function () { var i = presetIndex(); return i >= 0 ? PRESETS[i].n : "Custom kit"; } },
    { id: "body", label: "Body type", focus: "full", sub: function () { var b = BODIES.filter(function (x) { return x.id === state.body; })[0]; return b.n + " · " + state.height + " cm"; } },
    { id: "shirt", label: "Shirt", focus: "shirt", sub: function () { return NAMES[state.shirt] || "Custom"; } },
    { id: "trim", label: "Trim & logos", focus: "shirt", sub: function () { return (NAMES[state.trim] || "Custom") + " · " + (state.trimPat === "plain" ? "solid" : "patterned"); } },
    { id: "shorts", label: "Shorts & socks", focus: "shorts", sub: function () { return NAMES[state.shorts] || "Custom"; } },
    { id: "fabric", label: "Fabric & collar", focus: "shirt", sub: function () { return { checker: "Checker", stripes: "Stripes", plain: "Plain" }[state.pat] + " · " + { vneck: "V-neck", crew: "Crew", polo: "Polo" }[state.collar]; } },
    { id: "logos", label: "Team logo", focus: "shirt", sub: function () { return state.customerMode === "custom" ? "Uploaded logo" : "Add your logo"; } },
    { id: "name", label: "Name & number", focus: "back", view: "back", sub: function () { return state.name + " · " + (state.number || "–"); } }
  ];

  /* ---------- panel builders ---------- */
  function colourGrid(key) {
    return '<div class="grid g3">' + PALETTE.map(function (c) {
      return '<button type="button" class="tile' + (state[key] === c[1] ? " on" : "") + '" data-act="colour" data-key="' + key + '" data-c="' + c[1] + '" aria-label="' + c[0] + '"><i class="sw" style="--c:' + c[1] + '"></i><span class="nm">' + c[0] + '</span></button>';
    }).join("") + "</div>";
  }
  function optCard(act, v, on, label, pv) { return '<button type="button" class="tile opt' + (on ? " on" : "") + '" data-act="' + act + '" data-v="' + v + '"><span class="pv ' + (pv.cls || "") + '">' + (pv.html || "") + '</span><span class="nm">' + label + "</span></button>"; }
  var COLLAR_SVG = {
    vneck: '<svg viewBox="0 0 52 44"><path d="M6 6l14 4 6 14 6-14 14-4" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    crew: '<svg viewBox="0 0 52 44"><path d="M6 6l12 4c4 8 12 8 16 0l12-4" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    polo: '<svg viewBox="0 0 52 44"><path d="M8 6l10 4 8 16 8-16 10-4-4 10-8 4-6 10-6-10-8-4z" fill="rgba(255,255,255,.2)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>'
  };
  function figIcon(b) {
    var cx = 30, sw = b.sw, ww = b.ww, ar = b.ar, lg = b.lg;
    return '<svg viewBox="0 0 60 100" aria-hidden="true"><g fill="#fff" opacity=".92"><rect x="' + (cx - 3.2) + '" y="6" width="6.4" height="7" rx="2"/>' +
      '<path d="M' + (cx - sw) + ' 17q' + sw + ' -6 ' + (2 * sw) + ' 0l' + (ww - sw + 1) + ' 30q-' + (ww + 1) + ' 4 -' + (2 * ww + 2) + ' 0z" transform="translate(0 0)"/>' +
      '<path d="M' + (cx - sw - ar) + ' 18l' + ar + ' -1 -1 32 -' + (ar - 0.4) + ' 0z"/><path d="M' + (cx + sw + ar) + ' 18l-' + ar + ' -1 1 32 ' + (ar - 0.4) + ' 0z"/>' +
      '<path d="M' + (cx - ww - 1) + ' 46h' + (2 * ww + 2) + 'l' + (lg * 0.4) + ' 48h-' + lg + 'l-' + (lg * 0.2) + ' -32l-' + (lg * 0.2) + ' 32h-' + lg + 'z"/></g></svg>';
  }
  function panelHtml(id) {
    var c = CATS.filter(function (x) { return x.id === id; })[0];
    var head = function (t, s) { return "<h2>" + t + '</h2><p class="sub">' + s + "</p>"; };
    if (id === "sets") {
      return head("Kit sets", "Start from a ready-made look, then fine-tune it.") + '<div class="grid g2">' + PRESETS.map(function (p, i) {
        return '<button type="button" class="tile preset' + (presetIndex() === i ? " on" : "") + '" data-act="preset" data-i="' + i + '">' + jerseyIcon(p.shirt, p.trim) + "<span><span class=\"nm\">" + p.n + '</span><span class="dots"><i style="--c:' + p.shirt + '"></i><i style="--c:' + p.trim + '"></i><i style="--c:' + p.shorts + '"></i></span></span></button>';
      }).join("") + "</div>";
    }
    if (id === "body") return head("Body type", "Choose the mannequin's build. The kit re-fits to it.") + '<div class="grid g2">' + BODIES.map(function (b) {
        return '<button type="button" class="tile opt body' + (state.body === b.id ? " on" : "") + '" data-act="body" data-v="' + b.id + '"><span class="pv">' + figIcon(b) + '</span><span class="nm">' + b.n + '</span><span class="bd">' + b.d + "</span></button>";
      }).join("") + "</div>" + "<h3>Height</h3>" + '<div class="field"><div class="hrow"><input type="range" id="in-height" min="165" max="195" step="1" value="' + state.height + '" aria-label="Height in centimetres"><output id="out-height">' + state.height + ' cm</output></div></div>' +
      '<p class="note">These are 3D body shapes to preview how the kit fits. Tell us the real sizes on the quote request.</p>';
    if (id === "shirt") return head("Shirt colour", "The main colour of the jersey.") + colourGrid("shirt");
    if (id === "trim") return head("Trim &amp; logo colour", "Collar, shoulders, cuffs, side panels, logos and lettering.") + colourGrid("trim") +
      "<h3>Trim finish</h3>" + '<div class="grid g2">' + optCard("trimPat", "ornament", state.trimPat === "ornament", "Patterned", { html: '<svg viewBox="0 0 52 44"><path d="M4 14q5-8 10 0t10 0t10 0t10 0M4 28q5-8 10 0t10 0t10 0t10 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>' }) + optCard("trimPat", "plain", state.trimPat === "plain", "Solid", { cls: "pln" }) + "</div>";
    if (id === "shorts") return head("Shorts &amp; socks", "One colour for both, with your trim on the vents and sock tops.") + colourGrid("shorts");
    if (id === "fabric") return head("Fabric &amp; collar", "Tonal fabric pattern and neckline.") + "<h3>Fabric pattern</h3>" + '<div class="grid g3">' +
      optCard("pat", "checker", state.pat === "checker", "Checker", { cls: "chk" }) + optCard("pat", "stripes", state.pat === "stripes", "Stripes", { cls: "str" }) + optCard("pat", "plain", state.pat === "plain", "Plain", { cls: "pln" }) + "</div>" +
      "<h3>Collar</h3>" + '<div class="grid g3">' + ["vneck", "crew", "polo"].map(function (v) { return optCard("collar", v, state.collar === v, { vneck: "V-neck", crew: "Crew", polo: "Polo" }[v], { html: COLLAR_SVG[v] }); }).join("") + "</div>";
    if (id === "logos") {
      var prev = state.customerMode === "custom" && logoData ? '<img src="' + logoData + '" alt="Your logo">' : '<span class="empty">No logo yet</span>';
      return head("Team logo", "The 90mins+ mark is the kit brand and stays on every kit. Add your team or company logo here.") +
        '<div class="logo-card-lg"><div class="logo-prev" id="logo-prev">' + prev + '</div>' +
        '<div class="btn-row"><button type="button" class="btn pri" data-act="logo-upload"><span>Upload logo</span></button>' + (state.customerMode === "custom" ? '<button type="button" class="btn" data-act="logo-none"><span>Remove logo</span></button>' : "") + '</div>' +
        '<input type="file" id="logo-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden>' +
        '<p class="note" id="logo-note">Appears on the right chest, the shorts and one sock. Until you add one, a dashed &ldquo;YOUR LOGO&rdquo; box marks the spot. Transparent PNG or SVG works best. The file stays in your browser, so attach it when you send your quote request.</p></div>';
    }
    return head("Name &amp; number", "Printed on the back of the shirt.") +
      '<div class="field"><label for="in-name">Back name</label><input id="in-name" maxlength="12" value="' + esc(state.name) + '" autocomplete="off"></div>' +
      '<div class="field"><label for="in-num">Shirt number</label><div class="stepper"><button type="button" data-act="num-" aria-label="Lower number">&minus;</button><input id="in-num" inputmode="numeric" maxlength="2" value="' + esc(state.number) + '"><button type="button" data-act="num+" aria-label="Raise number">+</button></div>' +
      '<div class="quick">' + ["1", "7", "9", "10", "11", "23"].map(function (n) { return '<button type="button" data-act="num" data-v="' + n + '"' + (state.number === n ? ' class="on"' : "") + ">" + n + "</button>"; }).join("") + "</div></div>";
  }

  /* ---------- rendering ---------- */
  function renderCats() {
    $("#cats").innerHTML = CATS.map(function (c, i) {
      return '<button type="button" class="cat' + (c.id === activeCat ? " on" : "") + '" data-cat="' + c.id + '"><span class="ic">' + ICON[c.id === "sets" ? "sets" : c.id === "logos" ? "logos" : c.id] + '</span><span><b>' + c.label + "</b><small>" + esc(c.sub()) + "</small></span>" + (i === 0 ? '<span class="key">Q</span>' : i === CATS.length - 1 ? '<span class="key">E</span>' : "") + "</button>";
    }).join("");
  }
  function renderPanel() { $("#panel").innerHTML = panelHtml(activeCat); bindPanel(); }
  function renderLegend() {
    var items = [["Shirt", state.shirt], ["Trim", state.trim], ["Shorts & socks", state.shorts]];
    $("#legend").innerHTML = items.map(function (it) { return '<span><i style="background:' + it[1] + '"></i><em>' + it[0] + "</em><b>" + (NAMES[it[1]] || "Custom") + "</b></span>"; }).join("");
  }
  function quoteLink() {
    var sum = "Kit design: shirt " + (NAMES[state.shirt] || state.shirt) + ", trim " + (NAMES[state.trim] || state.trim) + ", shorts and socks " + (NAMES[state.shorts] || state.shorts) + ", " + state.pat + " fabric, " + state.collar + " collar, " +
      (state.trimPat === "plain" ? "solid" : "patterned") + " trim, 90mins+ brand mark, team logo: " + (state.customerMode === "custom" ? "my own logo (I will attach the file)" : "none yet") + ", " + state.body + " body, " + state.height + " cm, back " + (state.name || "no name") + " " + (state.number || "no number") + ". Quantity: ";
    $("#quote").href = "contact.html?service=" + encodeURIComponent("Sports Apparel") + "&note=" + encodeURIComponent(sum);
  }
  function paint() {
    state.colors = { k1: state.shirt, k2: state.trim, k3: state.shorts, k4: legible(state.shorts), k5: legible(state.shirt) };
    $("#pc-num").textContent = state.number || "–"; $("#pc-name").textContent = state.name || "—";
    renderLegend(); quoteLink();
    $$(".cat").forEach(function (b) { var c = CATS.filter(function (x) { return x.id === b.getAttribute("data-cat"); })[0]; $("small", b).textContent = c.sub(); });
    if (window.Kit3D && Kit3D.update && ready) Kit3D.update(state);
    lsSet("siall-kit", JSON.stringify(pack()));
  }
  function refresh() { paint(); renderPanel(); }

  /* ---------- interactions ---------- */
  function setCat(id, noCam) {
    activeCat = id; $$(".cat").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-cat") === id); });
    renderPanel(); $("#panel").scrollTop = 0;
    var c = CATS.filter(function (x) { return x.id === id; })[0];
    if (!noCam && ready && window.Kit3D) { if (c.view) Kit3D.view(c.view); Kit3D.focus(c.focus); }
  }
  function bindPanel() {
    var panel = $("#panel");
    var inName = $("#in-name"), inNum = $("#in-num"), inH = $("#in-height");
    if (inH) inH.addEventListener("input", function () { state.height = parseInt(inH.value, 10); $("#out-height").textContent = state.height + " cm"; paint(); });
    if (inName) inName.addEventListener("input", function () { state.name = inName.value.toUpperCase().slice(0, 12); inName.value = state.name; paint(); });
    if (inNum) inNum.addEventListener("input", function () { state.number = inNum.value.replace(/\D/g, "").slice(0, 2); inNum.value = state.number; paint(); $$(".quick button", panel).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === state.number); }); });
    var file = $("#logo-file"), prev = $("#logo-prev");
    if (file) file.addEventListener("change", function () { takeLogo(file.files && file.files[0]); file.value = ""; });
    if (prev) {
      ["dragenter", "dragover"].forEach(function (ev) { prev.addEventListener(ev, function (e) { e.preventDefault(); prev.classList.add("over"); }); });
      ["dragleave", "drop"].forEach(function (ev) { prev.addEventListener(ev, function (e) { e.preventDefault(); prev.classList.remove("over"); }); });
      prev.addEventListener("drop", function (e) { takeLogo(e.dataTransfer && e.dataTransfer.files[0]); });
    }
  }
  function takeLogo(f) {
    var note = $("#logo-note"); if (!f) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(f.type)) { note.textContent = "Please choose a PNG, JPG, WEBP or SVG image."; return; }
    if (f.size > 5 * 1024 * 1024) { note.textContent = "That file is over 5 MB. Please use a smaller image."; return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || 512, h = img.naturalHeight || 512, k = Math.min(1, 800 / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        logoData = c.toDataURL("image/png");
        var ready2 = new Image(); ready2.onload = function () { state.customer = ready2; state.customerMode = "custom"; refresh(); renderCats(); toast("Logo added"); }; ready2.src = logoData;
      };
      img.onerror = function () { note.textContent = "Sorry, that image could not be read."; };
      img.src = fr.result;
    };
    fr.readAsDataURL(f);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-cat],[data-act],[data-view],[data-zoom]"); if (!t) return;
    if (t.hasAttribute("data-cat")) { setCat(t.getAttribute("data-cat")); return; }
    if (t.hasAttribute("data-view")) { if (window.Kit3D && ready) Kit3D.view(t.getAttribute("data-view")); syncSpin(); return; }
    if (t.hasAttribute("data-zoom")) { if (window.Kit3D && ready) Kit3D.zoom(parseFloat(t.getAttribute("data-zoom"))); return; }
    var act = t.getAttribute("data-act");
    if (act === "colour") state[t.getAttribute("data-key")] = t.getAttribute("data-c");
    else if (act === "preset") { Object.assign(state, PRESETS[+t.getAttribute("data-i")]); delete state.n; }
    else if (act === "pat" || act === "collar" || act === "trimPat") state[act] = t.getAttribute("data-v");
    else if (act === "body") state.body = t.getAttribute("data-v");
    else if (act === "num") state.number = t.getAttribute("data-v");
    else if (act === "num+" || act === "num-") { var n = parseInt(state.number || "0", 10) || 0; n = Math.max(0, Math.min(99, n + (act === "num+" ? 1 : -1))); state.number = String(n); }
    else if (act === "logo-upload") { var f = $("#logo-file"); if (f) f.click(); return; }
    else if (act === "logo-none") { state.customerMode = "none"; state.customer = null; logoData = null; }
    refresh(); renderCats();
  });
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || ""; if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
    var ids = CATS.map(function (c) { return c.id; }), i = ids.indexOf(activeCat);
    if (e.key === "q" || e.key === "Q") setCat(ids[(i + ids.length - 1) % ids.length]);
    else if (e.key === "e" || e.key === "E") setCat(ids[(i + 1) % ids.length]);
    else if (e.key === "ArrowLeft" && window.Kit3D && ready) { e.preventDefault(); Kit3D.rotate(-0.28); syncSpin(); }
    else if (e.key === "ArrowRight" && window.Kit3D && ready) { e.preventDefault(); Kit3D.rotate(0.28); syncSpin(); }
  });
  function syncSpin() { var b = $("#btn-spin"); if (window.Kit3D && ready) b.classList.toggle("on", Kit3D.isSpinning()); }
  $("#btn-spin").addEventListener("click", function () { if (window.Kit3D && ready) { Kit3D.setSpin(!Kit3D.isSpinning()); syncSpin(); } });
  $("#stage").addEventListener("pointerdown", function () { setTimeout(syncSpin, 50); });
  $("#btn-reset").addEventListener("click", function () { Object.assign(state, DEFAULT, { customer: null }); logoData = null; refresh(); renderCats(); toast("Reset to Night Shift"); });
  /* Save look: keep the look on this device and download a PNG picture of the kit */
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function composeImage(glBlob, cb) {
    var img = new Image(), u = URL.createObjectURL(glBlob);
    img.onload = function () {
      URL.revokeObjectURL(u);
      var w = img.naturalWidth, h = img.naturalHeight, pad = Math.round(h * 0.12);
      var c = document.createElement("canvas"); c.width = w; c.height = h + pad;
      var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, w, h + pad);
      g.addColorStop(0, "#050818"); g.addColorStop(1, "#0a2a6e");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0);
      var fs = Math.round(pad * 0.34);
      x.fillStyle = "#fff"; x.textBaseline = "middle"; x.font = "800 " + fs + "px Sora, Inter, Arial, sans-serif";
      x.textAlign = "left"; x.fillText((state.name || "My kit").toUpperCase(), Math.round(w * 0.04), h + pad / 2);
      x.fillStyle = "#ff6a0a"; x.textAlign = "right"; x.fillText(state.number ? "#" + state.number : "SI ALL Kit Studio", Math.round(w * 0.96), h + pad / 2);
      c.toBlob(function (b) { cb(b || glBlob); }, "image/png");
    };
    img.onerror = function () { URL.revokeObjectURL(u); cb(glBlob); };
    img.src = u;
  }
  $("#btn-save").addEventListener("click", function () {
    lsSet("siall-kit", JSON.stringify(pack()));
    if (!(window.Kit3D && ready && Kit3D.snapshot)) { toast("3D preview not ready yet"); return; }
    Kit3D.snapshot(function (blob) {
      if (!blob) { toast("Could not create the image"); return; }
      composeImage(blob, function (out) {
        var nm = (state.name || "kit").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kit";
        download(out, "siall-" + nm + (state.number ? "-" + state.number : "") + ".png");
        toast("Look saved as an image");
      });
    });
  });
  $("#btn-share").addEventListener("click", function () {
    var url = location.href.split("#")[0] + "#k=" + btoa(unescape(encodeURIComponent(JSON.stringify(pack()))));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { prompt("Copy this link", url); });
    else prompt("Copy this link", url);
  });

  /* ---------- start ---------- */
  var fromHash = null;
  try { var m = /[#&]k=([^&]+)/.exec(location.hash); if (m) fromHash = JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { fromHash = null; }
  if (!unpack(fromHash)) { var saved = lsGet("siall-kit"); if (saved) { try { unpack(JSON.parse(saved)); } catch (e) { /* ignore */ } } }
  state.colors = {};
  renderCats(); renderPanel(); paint();

  var ok = false;
  try { ok = !!(window.Kit3D && Kit3D.init($("#stage"), state, { bar: false, theme: "dark" })); } catch (e) { ok = false; }
  if (!ok) { $("#nogl").hidden = false; $("#loading").classList.add("done"); }
  else {
    ready = true; paint();
    var hide = function () { $("#loading").classList.add("done"); };
    setTimeout(hide, 900);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { Kit3D.update(state); });
  }
})();
