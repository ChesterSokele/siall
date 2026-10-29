(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---- Mobile menu + active link ----
  var toggle = $(".nav-toggle"), menu = $("#menu");
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
  });
  var active = $('[data-nav="' + document.body.getAttribute("data-page") + '"]', menu);
  if (active) active.classList.add("active");

  // ---- Scroll state + progress bar ----
  var bar = $(".progress");
  function onScroll() {
    root.classList.toggle("scrolled", window.scrollY > 20);
    var h = root.scrollHeight - window.innerHeight;
    if (bar && h > 0) bar.style.transform = "scaleX(" + Math.min(1, window.scrollY / h) + ")";
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Reveal on scroll ----
  var items = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 0.08 + "s"); io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add("in"); }); }

  // ---- Counters ----
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "", t0 = null;
        if (reduce) { el.textContent = to + suf; return; }
        (function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e) + suf;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // ---- Pointer effects (hero spotlight, card glow, magnetic buttons) ----
  var hero = $(".hero");
  if (hero && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  }
  $$(".feature, .spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--sx", (e.clientX - r.left) + "px");
      el.style.setProperty("--sy", (e.clientY - r.top) + "px");
    });
  });
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    $$(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18) + "px," + ((e.clientY - r.top - r.height / 2) * 0.3 - 2) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  // ---- Corridor map ----
  var corr = $$(".corr-item");
  function showRoute(id) {
    corr.forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-route") === id); });
    $$(".route").forEach(function (r) { r.classList.toggle("on", r.getAttribute("data-route") === id); });
  }
  corr.forEach(function (c) {
    var id = c.getAttribute("data-route");
    c.addEventListener("mouseenter", function () { showRoute(id); });
    c.addEventListener("focus", function () { showRoute(id); });
    c.addEventListener("click", function () { showRoute(id); });
  });
  if (corr.length) showRoute(corr[0].getAttribute("data-route"));

  // ---- Tabs ----
  $$(".tabs").forEach(function (tabs) {
    var btns = $$(".tab", tabs.parentNode), panels = $$(".tabpanel", tabs.parentNode);
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        btns.forEach(function (x, j) { x.classList.toggle("on", i === j); x.setAttribute("aria-selected", i === j); });
        panels.forEach(function (p, j) { p.classList.toggle("on", i === j); });
      });
    });
  });

  // ---- Shelf drag scroll ----
  $$(".shelf").forEach(function (s) {
    var down = false, sx = 0, sl = 0;
    s.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; sx = e.clientX; sl = s.scrollLeft; s.style.cursor = "grabbing"; s.style.scrollSnapType = "none"; });
    window.addEventListener("pointerup", function () { if (!down) return; down = false; s.style.cursor = ""; s.style.scrollSnapType = ""; });
    window.addEventListener("pointermove", function (e) { if (down) s.scrollLeft = sl - (e.clientX - sx); });
  });

  // ---- Kit designer ----
  var kit = $("#kit");
  if (kit) {
    var state = { shirt: "#17181b", trim: "#e6f01d", shorts: "#17181b", number: "10", name: "SI ALL", pat: "checker", collar: "vneck", trimPat: "ornament", customer: null, colors: {} };
    var logoData = null; // PNG data URL of the customer's logo (flat view)
    var names = { "#17181b": "Black", "#0a3d99": "Royal blue", "#071a4d": "Navy", "#ff6a0a": "Orange", "#d62839": "Red", "#ffffff": "White", "#0f8a4b": "Green", "#e6f01d": "Neon yellow", "#3aa0ff": "Sky blue", "#6a2fb0": "Purple" };
    function lum(h) { var n = parseInt(h.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
    // logo and lettering use the trim colour unless it would vanish into the fabric
    function legible(bg) { return Math.abs(lum(state.trim) - lum(bg)) > 60 ? state.trim : (lum(bg) > 150 ? "#0b1634" : "#ffffff"); }
    var paint = function () {
      kit.style.setProperty("--k1", state.shirt);
      kit.style.setProperty("--k2", state.trim);
      kit.style.setProperty("--k3", state.shorts);
      kit.style.setProperty("--k4", legible(state.shorts));
      kit.style.setProperty("--k5", legible(state.shirt));
      state.colors = { k1: state.shirt, k2: state.trim, k3: state.shorts, k4: legible(state.shorts), k5: legible(state.shirt) };
      var custom = !!state.customer;
      $$("#kit .slot-ph").forEach(function (u) { u.setAttribute("display", custom ? "none" : "inline"); });
      $$("#kit .lg-cus").forEach(function (im) {
        if (custom && logoData) { im.setAttribute("href", logoData); im.setAttribute("display", "inline"); } else { im.setAttribute("display", "none"); }
      });
      if (window.Kit3D && Kit3D.update) Kit3D.update(state);
      kit.setAttribute("data-pat", state.pat);
      $("#kit-num").textContent = state.number;
      $("#kit-name").textContent = state.name;
      var sum = "Shirt " + names[state.shirt] + ", trim and logo " + names[state.trim] + ", shorts and socks " + names[state.shorts] +
        ", " + state.pat + " fabric, " + state.collar + " collar, " + (state.trimPat === "plain" ? "solid" : "patterned") + " trim, logo: " + (state.customer ? "my own logo on the kit (I will attach the file)" : "no customer logo yet") + ", back " + (state.name || "no name") + " " + (state.number || "no number");
      $("#kit-summary").textContent = sum;
      $("#kit-link").href = "contact.html?service=" + encodeURIComponent("Sports Apparel") + "&note=" + encodeURIComponent("Kit design: " + sum + ". Quantity: ");
    };
    $$(".sw").forEach(function (group) {
      var key = group.getAttribute("data-key");
      $$("button", group).forEach(function (b) {
        b.style.setProperty("--c", b.getAttribute("data-c"));
        b.setAttribute("aria-label", names[b.getAttribute("data-c")]);
        b.classList.toggle("on", b.getAttribute("data-c") === state[key]);
        b.addEventListener("click", function () {
          state[key] = b.getAttribute("data-c");
          $$("button", group).forEach(function (x) { x.classList.toggle("on", x === b); });
          paint();
        });
      });
    });
    $$(".pats").forEach(function (group) {
      var key = group.getAttribute("data-key");
      $$("button", group).forEach(function (b) {
        b.addEventListener("click", function () {
          state[key] = b.getAttribute("data-v");
          $$("button", group).forEach(function (x) { x.classList.toggle("on", x === b); });
          paint();
        });
      });
    });
    $("#kit-number").addEventListener("input", function (e) { state.number = e.target.value.replace(/\D/g, "").slice(0, 2); paint(); });
    $("#kit-nameinput").addEventListener("input", function (e) { state.name = e.target.value.toUpperCase().slice(0, 12); paint(); });
    // client logo upload: processed locally, never sent anywhere
    var note = $("#logo-note"), defNote = note ? note.textContent : "";
    $("#logo-clear").addEventListener("click", function () { state.customer = null; logoData = null; $("#logo-file").value = ""; note.textContent = defNote; paint(); });
    $("#logo-file").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
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
          var ready = new Image(); ready.onload = function () {
            state.customer = ready;
            note.textContent = "Using " + f.name + ". Attach this file when you send the enquiry.";
            paint();
          };
          ready.src = logoData;
        };
        img.onerror = function () { note.textContent = "Sorry, that image could not be read."; };
        img.src = fr.result;
      };
      fr.readAsDataURL(f);
    });
    paint();
    if (window.Kit3D && Kit3D.init) Kit3D.init($(".kit-stage"), state);
  }

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();


  // ---- Careers: application form with document upload ----
  (function () {
    var form = document.getElementById("apply-form");
    if (!form) return;
    var MAX = 5 * 1024 * 1024, MAX_DOCS = 5, TOTAL = 18 * 1024 * 1024;
    var OK_CV = ["pdf", "doc", "docx"], OK_DOC = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
    var files = { cv: null, docs: [] };
    var okBox = document.getElementById("apply-ok"), errBox = document.getElementById("apply-err");
    var note = document.getElementById("apply-note"), btn = document.getElementById("apply-submit");
    var prog = document.getElementById("apply-progress"), bar = document.getElementById("apply-bar");
    document.getElementById("apply-ts").value = String(Date.now());

    function ext(n) { var m = /\.([A-Za-z0-9]+)$/.exec(n); return m ? m[1].toLowerCase() : ""; }
    function size(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
    function showErr(msg) { errBox.innerHTML = msg; errBox.hidden = false; errBox.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    function clearMsgs() { errBox.hidden = true; okBox.hidden = true; note.textContent = ""; }

    function render() {
      [["cv", "files-cv"], ["docs", "files-docs"]].forEach(function (k) {
        var ul = document.getElementById(k[1]); ul.innerHTML = "";
        var list = k[0] === "cv" ? (files.cv ? [files.cv] : []) : files.docs;
        list.forEach(function (f, i) {
          var li = document.createElement("li");
          li.innerHTML = '<span class="ext"></span><span class="nm"></span><span class="sz"></span><button type="button" aria-label="Remove file">&times;</button>';
          li.querySelector(".ext").textContent = ext(f.name).slice(0, 4).toUpperCase();
          li.querySelector(".nm").textContent = f.name; li.querySelector(".nm").title = f.name;
          li.querySelector(".sz").textContent = size(f.size);
          li.querySelector("button").addEventListener("click", function () { if (k[0] === "cv") files.cv = null; else files.docs.splice(i, 1); render(); });
          ul.appendChild(li);
        });
      });
    }
    function addFiles(kind, list) {
      clearMsgs();
      Array.prototype.forEach.call(list, function (f) {
        var allowed = kind === "cv" ? OK_CV : OK_DOC;
        if (allowed.indexOf(ext(f.name)) < 0) { showErr("&ldquo;" + f.name.replace(/</g, "&lt;") + "&rdquo; is not an accepted file type (" + allowed.join(", ").toUpperCase() + ")."); return; }
        if (f.size > MAX) { showErr("&ldquo;" + f.name.replace(/</g, "&lt;") + "&rdquo; is larger than 5 MB (" + size(f.size) + ")."); return; }
        if (f.size === 0) { showErr("&ldquo;" + f.name.replace(/</g, "&lt;") + "&rdquo; is empty."); return; }
        if (kind === "cv") { files.cv = f; document.getElementById("dz-cv").classList.remove("invalid"); }
        else if (files.docs.length >= MAX_DOCS) showErr("You can attach up to " + MAX_DOCS + " supporting documents.");
        else if (!files.docs.some(function (d) { return d.name === f.name && d.size === f.size; })) files.docs.push(f);
      });
      render();
    }
    [["cv", "dz-cv", "cv-input"], ["docs", "dz-docs", "docs-input"]].forEach(function (k) {
      var dz = document.getElementById(k[1]), input = document.getElementById(k[2]);
      dz.addEventListener("click", function () { input.click(); });
      dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
      input.addEventListener("click", function (e) { e.stopPropagation(); });
      input.addEventListener("change", function () { addFiles(k[0], input.files); input.value = ""; });
      ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("over"); }); });
      ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("over"); }); });
      dz.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files.length) addFiles(k[0], k[0] === "cv" ? [e.dataTransfer.files[0]] : e.dataTransfer.files); });
    });

    // clear error styling as soon as a field is corrected
    form.addEventListener("input", function (e) { if (e.target.classList) e.target.classList.remove("invalid"); });
    form.addEventListener("change", function (e) { if (e.target.classList) e.target.classList.remove("invalid"); });
    // "Apply for this role" buttons preselect the position
    var sel = document.getElementById("apply-position");
    Array.prototype.forEach.call(document.querySelectorAll("[data-role]"), function (a) {
      a.addEventListener("click", function () {
        var role = a.getAttribute("data-role").replace(/&amp;/g, "&");
        for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === role) sel.selectedIndex = i;
      });
    });
    var qs = new URLSearchParams(window.location.search);
    if (qs.get("sent")) { okBox.innerHTML = "<strong>Application received</strong>Thank you. We will be in touch if your profile matches a role."; okBox.hidden = false; form.classList.add("sent"); }
    if (qs.get("error")) showErr(qs.get("error").replace(/</g, "&lt;"));

    function validate() {
      var bad = null;
      ["name", "email", "phone", "position"].forEach(function (n) {
        var el = form.elements[n], v = String(el.value || "").trim();
        var wrong = !v || (n === "email" && !/^\S+@\S+\.\S+$/.test(v)) || (n === "phone" && v.replace(/\D/g, "").length < 7);
        el.classList.toggle("invalid", wrong); if (wrong && !bad) bad = el;
      });
      document.getElementById("dz-cv").classList.toggle("invalid", !files.cv);
      if (bad) { bad.focus(); return "Please complete the highlighted fields."; }
      if (!files.cv) return "Please attach your CV.";
      if (!form.elements.consent.checked) return "Please tick the box to confirm that we may keep your details.";
      var total = (files.cv ? files.cv.size : 0) + files.docs.reduce(function (s, f) { return s + f.size; }, 0);
      if (total > TOTAL) return "The files are too large together (" + size(total) + "). Please keep the total under 18 MB.";
      return "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault(); clearMsgs();
      var problem = validate(); if (problem) { showErr(problem); return; }
      var fd = new FormData(form);
      fd.delete("cv"); fd.delete("docs[]"); fd.delete("docs");
      fd.append("cv", files.cv, files.cv.name);
      files.docs.forEach(function (f) { fd.append("docs[]", f, f.name); });
      var xhr = new XMLHttpRequest();
      xhr.open("POST", form.getAttribute("action"));
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest"); xhr.setRequestHeader("Accept", "application/json");
      btn.disabled = true; btn.textContent = "Sending..."; prog.hidden = false; bar.style.width = "0";
      xhr.upload.onprogress = function (ev) { if (ev.lengthComputable) bar.style.width = Math.round(ev.loaded / ev.total * 100) + "%"; };
      function fail(msg) {
        btn.disabled = false; btn.innerHTML = "Submit application"; prog.hidden = true;
        showErr(msg);
      }
      xhr.onerror = function () { fail("We could not reach the server. Check your connection and try again, or email your CV to <a href=\"mailto:info@sialllogistics.com?subject=Job%20application\">info@sialllogistics.com</a>."); };
      xhr.onload = function () {
        var res = null; try { res = JSON.parse(xhr.responseText); } catch (x) { /* not JSON */ }
        if (xhr.status === 200 && res && res.ok) {
          btn.disabled = false; btn.innerHTML = "Submit application"; prog.hidden = true; bar.style.width = "0";
          okBox.innerHTML = "<strong>Application received</strong>" + (res.message || "Thank you.") + (res.ref ? " Your reference is <b>" + res.ref + "</b>." : "") + " We will be in touch if your profile matches a role.";
          okBox.hidden = false; form.classList.add("sent"); form.reset(); files = { cv: null, docs: [] }; render();
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (res && res.message) { fail(res.message); }
        else if ([0, 403, 404, 405, 501].indexOf(xhr.status) >= 0) { fail("The online form is not available on this server yet. Please email your CV and documents to <a href=\"mailto:info@sialllogistics.com?subject=Job%20application\">info@sialllogistics.com</a>."); }
        else { fail("Something went wrong (" + xhr.status + "). Please try again or email <a href=\"mailto:info@sialllogistics.com?subject=Job%20application\">info@sialllogistics.com</a>."); }
      };
      xhr.send(fd);
    });
  })();

  // ---- Contact form (mailto until a backend exists) ----
  var form = $("#contact-form");
  if (!form) return;
  var TO = "info@sialllogistics.com", note = $(".form-note", form);
  var qs = new URLSearchParams(window.location.search);
  if (qs.get("service")) {
    for (var i = 0; i < form.service.options.length; i++) {
      if (form.service.options[i].value === qs.get("service")) form.service.selectedIndex = i;
    }
  }
  if (qs.get("note")) form.message.value = qs.get("note");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form), ok = true;
    ["name", "email", "message"].forEach(function (f) {
      var v = String(data.get(f) || "").trim();
      var bad = !v || (f === "email" && !/^\S+@\S+\.\S+$/.test(v));
      form.elements[f].classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = "Please complete the highlighted fields."; return; }
    var body = ["Name: " + data.get("name"), "Phone: " + (data.get("phone") || "-"), "Email: " + data.get("email"),
      "Service: " + data.get("service"), "", data.get("message")].join("\n");
    window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent("Website enquiry: " + data.get("service")) + "&body=" + encodeURIComponent(body);
    note.textContent = "Opening your email app. Thank you!";
  });
})();
