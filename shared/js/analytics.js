// Tracking + submit compartilhado entre variantes A e B.
// Captura tudo que faz sentido pra atribuir lead:
//   - UTMs completos (incluindo utm_id, utm_source_platform, etc.)
//   - Google Ads (gclid, gbraid, wbraid, dclid)
//   - Microsoft/Bing (msclkid)
//   - Facebook (fbclid + cookies _fbp, _fbc)
//   - Google Analytics (cookies _ga, _gid)
//   - Sessão (referrer, landing page, user agent, timestamps)
// Persiste UTMs e click IDs em sessionStorage para não perder em navegações internas.

(function () {
  const variant = document.body.dataset.variant || "unknown";

  // ---- Config (override externo: window.__pbqph.config.webhookUrl = "...") ----
  const config = {
    webhookUrl: null,
    debug: false,
  };

  // ---- Helpers ----
  function readCookie(name) {
    const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function sessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }
  function sessionSet(key, value) {
    try { if (value) sessionStorage.setItem(key, value); } catch (_) {}
  }

  // Campos de marketing que persistem na sessão
  const TRACK_KEYS = [
    // UTMs padrão
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    // UTMs novos (GA4 / Meta)
    "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
    // Google
    "gclid", "gbraid", "wbraid", "dclid",
    "gad_source", "gad_campaignid",
    // Facebook / Instagram
    "fbclid",
    // Microsoft / Bing
    "msclkid",
    // TikTok
    "ttclid",
    // LinkedIn
    "li_fat_id",
    // X / Twitter
    "twclid",
    // Impact
    "irclickid",
    // Taboola
    "tblci",
    // Systeme / outros
    "sck",
  ];

  // ---- Captura UTMs + Click IDs do query string, com persistência ----
  function captureAttribution() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    TRACK_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) {
        out[k] = v;
        sessionSet("attr_" + k, v);
      } else {
        const stored = sessionGet("attr_" + k);
        if (stored) out[k] = stored;
      }
    });
    return out;
  }

  // ---- Captura referrer / landing page (1ª pageview da sessão) ----
  function captureSession() {
    let landing = sessionGet("session_landing");
    if (!landing) {
      landing = window.location.href;
      sessionSet("session_landing", landing);
    }
    let firstReferrer = sessionGet("session_referrer");
    if (firstReferrer === null) {
      firstReferrer = document.referrer || "";
      sessionSet("session_referrer", firstReferrer);
    }
    let sessionStart = sessionGet("session_start_ts");
    if (!sessionStart) {
      sessionStart = String(Date.now());
      sessionSet("session_start_ts", sessionStart);
    }
    return {
      landing_page: landing,
      session_referrer: firstReferrer,
      session_start_ts: Number(sessionStart),
      current_url: window.location.href,
      current_referrer: document.referrer || "",
    };
  }

  // ---- Cookies de tracking (Facebook, Google Analytics) ----
  function captureCookies() {
    return {
      fbp: readCookie("_fbp"),        // Facebook Browser ID
      fbc: readCookie("_fbc"),        // Facebook Click ID cookie
      ga_client_id: readCookie("_ga"),// GA Client ID (formato GA1.2.xxx.yyy)
      ga_session: readCookie("_gid"), // GA Session
    };
  }

  // ---- Device / browser ----
  function captureDevice() {
    return {
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_width: window.screen?.width || null,
      screen_height: window.screen?.height || null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat?.().resolvedOptions().timeZone || null,
    };
  }

  // ---- Cache dos atributos por sessão (computa 1x) ----
  let _cachedContext = null;
  function getContext() {
    if (_cachedContext) return _cachedContext;
    _cachedContext = {
      ...captureAttribution(),
      ...captureSession(),
      ...captureCookies(),
      ...captureDevice(),
    };
    return _cachedContext;
  }

  // ---- Geração de event_id (dedupe entre Pixel + CAPI) ----
  function generateEventId() {
    return "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  // ---- Track genérico ----
  function track(event, payload) {
    const ctx = getContext();
    const data = {
      event,
      variant,
      event_id: generateEventId(),
      ts: Date.now(),
      page_url: location.href,
      page_path: location.pathname,
      ...ctx,
      ...payload,
    };
    (window.dataLayer = window.dataLayer || []).push(data);
    if (window.VWO && typeof window.VWO.event === "function") window.VWO.event(event, data);
    if (window.optimizely && Array.isArray(window.optimizely)) {
      window.optimizely.push({ type: "event", eventName: event, tags: data });
    }
    if (config.debug) console.log("[track]", event, data);
  }

  // ---- Click auto-track em [data-track] ----
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    if (el.tagName === "FORM") return;
    track(el.dataset.track, { label: el.textContent?.trim().slice(0, 80) });
  });

  // ---- Submit do lead → POST webhook ----
  async function submitLead(payload, opts = {}) {
    const source = opts.source || "form";
    const event = opts.event || "lead_submit";
    const ctx = getContext();
    const eventId = generateEventId();

    const body = {
      event,
      event_id: eventId,
      variant,
      source,
      ts: Date.now(),
      // Form fields
      ...payload,
      // Atribuição + sessão + cookies + device
      ...ctx,
      page_url: location.href,
      page_path: location.pathname,
    };

    // Dispara no dataLayer com o mesmo event_id (dedupe Pixel/CAPI)
    track(event, { ...payload, source, event_id: eventId });

    if (!config.webhookUrl) {
      if (config.debug) console.log("[submitLead] sem webhook configurado, simulando sucesso", body);
      return { ok: true, simulated: true };
    }

    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return { ok: true };
    } catch (err) {
      track("lead_submit_error", { message: String(err) });
      return { ok: false, error: err };
    }
  }

  // Inicializa o context cedo (captura UTMs/cookies o quanto antes)
  document.addEventListener("DOMContentLoaded", () => { getContext(); });

  window.__pbqph = { track, submitLead, config, getContext };
})();
