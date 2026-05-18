// Tracking + atribuição + lead submit — compartilhado entre A e B.
// Estratégia:
//   - First-touch persistido em cookies de 2 anos no root domain
//   - Last-touch lido do URL atual ou fallback (referrer map -> cookie)
//   - Session ID em sessionStorage
//   - Referrer mapping para atribuição orgânica (google, instagram, chatgpt, claude, etc.)
//   - Auto-fill de inputs hidden do form
//   - DataLayer com ft_* (first-touch) e * (last-touch) em paralelo
//   - Microsoft Clarity custom tags
//   - Scroll depth (25/50/75/90)
//   - Time on page heartbeat + submit
//   - POST do lead pro webhook com payload completo

(function () {
  var variant = document.body.dataset.variant || "unknown";

  // ============ DOMAIN (root, para cookies cross-subdomain) ============
  var DOMAIN = (function () {
    var parts = window.location.hostname.split(".");
    if (parts.length < 2) return ""; // localhost
    return "." + parts.slice(-2).join(".");
  })();
  var MAX_AGE = 63072000; // 2 anos

  // ============ CHAVES DE TRACKING ============
  var UTM_KEYS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
  ];
  var CLICK_KEYS = [
    "gclid", "gbraid", "wbraid", "dclid", "gad_source", "gad_campaignid", // Google
    "fbclid",                                                              // Meta
    "msclkid",                                                             // Microsoft / Bing
    "ttclid",                                                              // TikTok
    "li_fat_id",                                                           // LinkedIn
    "twclid",                                                              // X / Twitter
    "irclickid",                                                           // Impact
    "tblci",                                                               // Taboola
    "sck",                                                                 // Systeme / outros
  ];
  var ALL_KEYS = UTM_KEYS.concat(CLICK_KEYS);

  // ============ CONFIG (override externo) ============
  var config = { webhookUrl: null, debug: false };

  // ============ COOKIE HELPERS ============
  function readCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }
  function writeCookie(name, value, maxAge) {
    if (value === null || value === undefined) return;
    var parts = [
      name + "=" + encodeURIComponent(String(value)),
      "Path=/",
      "Max-Age=" + (maxAge || MAX_AGE),
      "SameSite=Lax",
    ];
    if (DOMAIN) parts.push("Domain=" + DOMAIN);
    if (location.protocol === "https:") parts.push("Secure");
    document.cookie = parts.join("; ");
  }
  function setFirstTouch(name, value) {
    if (readCookie(name)) return false; // já tem, não sobrescreve
    writeCookie(name, value);
    if (config.debug) console.log("[FT]", name, "=", value);
    return true;
  }

  // ============ SESSION HELPERS ============
  function getSessionId() {
    try {
      var k = "apex_session_id";
      var s = sessionStorage.getItem(k);
      if (!s) {
        s = Date.now() + "_" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(k, s);
      }
      return s;
    } catch (_) {
      return "no_ss_" + Date.now();
    }
  }

  // ============ URL PARAM ============
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ============ REFERRER MAP ============
  var REFERRER_MAP = {
    "google.":            { utm_source: "google",      utm_medium: "organic" },
    "bing.com":           { utm_source: "bing",        utm_medium: "organic" },
    "yahoo.com":          { utm_source: "yahoo",       utm_medium: "organic" },
    "duckduckgo.com":     { utm_source: "duckduckgo",  utm_medium: "organic" },
    "yandex.":            { utm_source: "yandex",      utm_medium: "organic" },
    "ecosia.org":         { utm_source: "ecosia",      utm_medium: "organic" },
    "brave.com":          { utm_source: "brave",       utm_medium: "organic" },
    "instagram.com":      { utm_source: "instagram",   utm_medium: "social" },
    "facebook.com":       { utm_source: "facebook",    utm_medium: "social" },
    "l.facebook.com":     { utm_source: "facebook",    utm_medium: "social" },
    "youtube.com":        { utm_source: "youtube",     utm_medium: "social" },
    "youtu.be":           { utm_source: "youtube",     utm_medium: "social" },
    "twitter.com":        { utm_source: "twitter",     utm_medium: "social" },
    "x.com":              { utm_source: "twitter",     utm_medium: "social" },
    "t.co":               { utm_source: "twitter",     utm_medium: "social" },
    "linkedin.com":       { utm_source: "linkedin",    utm_medium: "social" },
    "lnkd.in":            { utm_source: "linkedin",    utm_medium: "social" },
    "tiktok.com":         { utm_source: "tiktok",      utm_medium: "social" },
    "pinterest.":         { utm_source: "pinterest",   utm_medium: "social" },
    "reddit.com":         { utm_source: "reddit",      utm_medium: "social" },
    "whatsapp.com":       { utm_source: "whatsapp",    utm_medium: "social" },
    "wa.me":              { utm_source: "whatsapp",    utm_medium: "social" },
    "telegram.org":       { utm_source: "telegram",    utm_medium: "social" },
    "t.me":               { utm_source: "telegram",    utm_medium: "social" },
    "chat.openai.com":    { utm_source: "chatgpt",     utm_medium: "ai" },
    "chatgpt.com":        { utm_source: "chatgpt",     utm_medium: "ai" },
    "gemini.google.com":  { utm_source: "gemini",      utm_medium: "ai" },
    "claude.ai":          { utm_source: "claude",      utm_medium: "ai" },
    "poe.com":            { utm_source: "poe",         utm_medium: "ai" },
    "perplexity.ai":      { utm_source: "perplexity",  utm_medium: "ai" },
    "wikipedia.org":      { utm_source: "wikipedia",   utm_medium: "referral" },
    "github.com":         { utm_source: "github",      utm_medium: "referral" },
    "medium.com":         { utm_source: "medium",      utm_medium: "referral" },
  };
  function isInternalReferrer(referrer) {
    if (!referrer) return false;
    try {
      var ref = new URL(referrer).hostname.replace(/^www\./, "");
      var cur = window.location.hostname.replace(/^www\./, "");
      return ref === cur || ref.endsWith("." + cur) || cur.endsWith("." + ref);
    } catch (_) { return false; }
  }
  function inferFromReferrer(referrer) {
    if (!referrer || isInternalReferrer(referrer)) return null;
    for (var key in REFERRER_MAP) {
      if (referrer.indexOf(key) !== -1) return REFERRER_MAP[key];
    }
    return null;
  }

  // ============ FIRST TOUCH ATTRIBUTION ============
  function captureFirstTouch() {
    var hasUtmInUrl = UTM_KEYS.some(function (k) { return !!getParam(k); });

    if (hasUtmInUrl) {
      UTM_KEYS.forEach(function (k) {
        var v = getParam(k);
        if (v) setFirstTouch(k, v);
      });
    } else {
      var inferred = inferFromReferrer(document.referrer);
      if (inferred) {
        Object.keys(inferred).forEach(function (k) { setFirstTouch(k, inferred[k]); });
        if (config.debug) console.log("[Referrer mapped]", document.referrer, inferred);
      }
    }

    CLICK_KEYS.forEach(function (k) {
      var v = getParam(k);
      if (v) setFirstTouch(k, v);
    });

    // Gera _fbc a partir do fbclid (formato Meta CAPI)
    var fbclid = getParam("fbclid");
    if (fbclid && !readCookie("_fbc")) {
      writeCookie("_fbc", "fb.1." + Date.now() + "." + fbclid);
    }

    // First visit + landing page + origin (referrer externo na 1ª visita)
    if (!readCookie("first_visit")) writeCookie("first_visit", new Date().toISOString());
    if (!readCookie("landing_page")) writeCookie("landing_page", window.location.href);
    if (!readCookie("origin_page")) {
      var ref = document.referrer || "";
      if (ref && !isInternalReferrer(ref)) writeCookie("origin_page", ref);
    }

    // ?ref= custom param (programas de afiliado simples)
    var refParam = getParam("ref");
    if (refParam && !readCookie("ref")) writeCookie("ref", refParam);
  }

  // ============ LAST TOUCH (URL atual > referrer > cookie) ============
  function getLastTouch() {
    var ref = document.referrer;
    var inferred = inferFromReferrer(ref);
    var out = {};

    UTM_KEYS.forEach(function (k) {
      var fromUrl = getParam(k);
      if (fromUrl) out[k] = fromUrl;
      else if (inferred && (k === "utm_source" || k === "utm_medium")) out[k] = inferred[k];
      else out[k] = readCookie(k) || "";
    });
    CLICK_KEYS.forEach(function (k) {
      var fromUrl = getParam(k);
      out[k] = fromUrl || readCookie(k) || "";
    });
    return out;
  }

  // ============ FIRST TOUCH SNAPSHOT (cookies) ============
  function getFirstTouchSnapshot() {
    var out = {};
    ALL_KEYS.forEach(function (k) {
      var v = readCookie(k);
      if (v) out["ft_" + k] = v;
    });
    return out;
  }

  // ============ DEVICE / SESSION CONTEXT ============
  function getContext() {
    var sessionStart = (function () {
      try {
        var v = sessionStorage.getItem("apex_session_start");
        if (!v) { v = String(Date.now()); sessionStorage.setItem("apex_session_start", v); }
        return Number(v);
      } catch (_) { return Date.now(); }
    })();

    return {
      session_id: getSessionId(),
      session_start_ts: sessionStart,
      first_visit: readCookie("first_visit") || "",
      landing_page: readCookie("landing_page") || "",
      origin_page: readCookie("origin_page") || "",
      ref: readCookie("ref") || "",
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_hostname: window.location.hostname,
      current_referrer: document.referrer || "",
      fbp: readCookie("_fbp") || "",
      fbc: readCookie("_fbc") || "",
      ga_client_id: readCookie("_ga") || "",
      ga_session: readCookie("_gid") || "",
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_width: window.screen ? window.screen.width : null,
      screen_height: window.screen ? window.screen.height : null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1,
      timezone: (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
    };
  }

  // ============ EVENT ID (dedupe Pixel/CAPI) ============
  function generateEventId() {
    return "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  // ============ TRACK ============
  function track(event, payload) {
    var data = Object.assign({
      event: event,
      event_id: generateEventId(),
      variant: variant,
      ts: Date.now(),
    }, getFirstTouchSnapshot(), getLastTouch(), getContext(), payload || {});

    (window.dataLayer = window.dataLayer || []).push(data);
    if (window.VWO && typeof window.VWO.event === "function") window.VWO.event(event, data);
    if (window.optimizely && Array.isArray(window.optimizely)) {
      window.optimizely.push({ type: "event", eventName: event, tags: data });
    }
    if (config.debug) console.log("[track]", event, data);
  }

  // ============ AUTO-TRACK CLIQUES [data-track] ============
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (!el || el.tagName === "FORM") return;
    track(el.dataset.track, { label: (el.textContent || "").trim().slice(0, 80) });
  });

  // ============ AUTO-FILL DE INPUTS HIDDEN ============
  function fillFormInputs() {
    var last = getLastTouch();
    ALL_KEYS.forEach(function (k) {
      var v = last[k] || readCookie(k);
      if (!v) return;
      document.querySelectorAll('input[name="' + k + '"], input[data-field-id="' + k + '"]').forEach(function (input) {
        if (!input.value) input.value = v;
      });
    });
  }

  // ============ LEAD SUBMIT ============
  function submitLead(payload, opts) {
    opts = opts || {};
    var source = opts.source || "form";
    var event = opts.event || "lead_submit";
    var eventId = generateEventId();
    var pageStart = window.__pbqphStartTs || Date.now();

    var body = Object.assign({
      event: event,
      event_id: eventId,
      variant: variant,
      source: source,
      ts: Date.now(),
      time_on_page_at_submit: Math.round((Date.now() - pageStart) / 1000),
    }, payload, getFirstTouchSnapshot(), getLastTouch(), getContext());

    // Dispara no dataLayer com mesmo event_id pra dedupe Pixel/CAPI
    track(event, Object.assign({}, payload, { source: source, event_id: eventId }));

    // Persiste email/nome em cookie (pra Clarity e re-identificação)
    if (payload && payload.email) writeCookie("cookie_em", payload.email);
    if (payload && payload.name) writeCookie("cookie_nm", payload.name);

    if (!config.webhookUrl) {
      if (config.debug) console.log("[submitLead] sem webhook configurado, simulando sucesso", body);
      return Promise.resolve({ ok: true, simulated: true });
    }

    return fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return { ok: true };
      })
      .catch(function (err) {
        track("lead_submit_error", { message: String(err) });
        return { ok: false, error: err };
      });
  }

  // ============ CLARITY ============
  function initClarity() {
    function applyTags() {
      if (typeof window.clarity !== "function") return;
      var src = readCookie("utm_source") || readCookie("ft_utm_source") || "";
      var med = readCookie("utm_medium") || readCookie("ft_utm_medium") || "";
      var cmp = readCookie("utm_campaign") || readCookie("ft_utm_campaign") || "";
      var ext = readCookie("external_id") || "";
      if (src) window.clarity("set", "utm_source", src);
      if (med) window.clarity("set", "utm_medium", med);
      if (cmp) window.clarity("set", "utm_campaign", cmp);
      if (ext) window.clarity("set", "external_id", ext);
      window.clarity("set", "variant", variant);
    }
    applyTags();
    setTimeout(applyTags, 2000);

    document.addEventListener("submit", function () {
      setTimeout(function () {
        if (typeof window.clarity !== "function") return;
        var em = readCookie("cookie_em") || "";
        var nm = readCookie("cookie_nm") || "";
        if (em) window.clarity("set", "lead_email", em);
        if (nm) window.clarity("set", "lead_name", nm);
        window.clarity("set", "converted", "true");
      }, 500);
    }, true);
  }

  // ============ SCROLL DEPTH ============
  function initScrollDepth() {
    var milestones = [25, 50, 75, 90];
    var reached = {};
    var pageStart = Date.now();

    function pct() {
      var doc = document.documentElement;
      var body = document.body;
      var top = doc.scrollTop || body.scrollTop;
      var max = Math.max(doc.scrollHeight, body.scrollHeight) - doc.clientHeight;
      if (max <= 0) return 100;
      return Math.round((top / max) * 100);
    }
    function onScroll() {
      var p = pct();
      milestones.forEach(function (m) {
        if (!reached[m] && p >= m) {
          reached[m] = true;
          var timeOnPage = Math.round((Date.now() - pageStart) / 1000);
          (window.dataLayer = window.dataLayer || []).push({
            event: "scroll_depth",
            session_id: getSessionId(),
            scroll_depth: m,
            time_on_page: timeOnPage,
            page_path: window.location.pathname,
            variant: variant,
          });
          if (config.debug) console.log("[scroll]", m + "%", timeOnPage + "s");
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ============ TIME ON PAGE ============
  function initTimeOnPage() {
    window.__pbqphStartTs = Date.now();
    var count = 0;
    var heartbeat = setInterval(function () {
      count++;
      var t = Math.round((Date.now() - window.__pbqphStartTs) / 1000);
      (window.dataLayer = window.dataLayer || []).push({
        event: "time_on_page_heartbeat",
        session_id: getSessionId(),
        time_on_page: t,
        heartbeat: count,
        page_path: window.location.pathname,
        variant: variant,
      });
      if (count >= 20) clearInterval(heartbeat); // 10 minutos
    }, 30000);
  }

  // ============ PAGE VIEW ============
  function pushPageView() {
    var ctx = getContext();
    var ft = getFirstTouchSnapshot();
    var lt = getLastTouch();

    (window.dataLayer = window.dataLayer || []).push(Object.assign({}, ft, lt, ctx, {
      event: "custom_page_view",
      variant: variant,
    }));

    if (config.debug) console.log("[page_view] ft:", ft, "lt:", lt, "ctx:", ctx);
  }

  // ============ INIT ============
  function init() {
    captureFirstTouch();
    pushPageView();
    fillFormInputs();
    initClarity();
    initScrollDepth();
    initTimeOnPage();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-fill inputs quando o form for criado dinamicamente (form.js)
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(fillFormInputs, 100);
  });

  window.__pbqph = {
    track: track,
    submitLead: submitLead,
    config: config,
    getContext: getContext,
    getFirstTouch: getFirstTouchSnapshot,
    getLastTouch: getLastTouch,
    fillFormInputs: fillFormInputs,
  };
})();
