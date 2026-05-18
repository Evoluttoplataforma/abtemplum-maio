// Tracking + submit compartilhado entre variantes A e B.
// - Elementos com data-track="<evento>" disparam evento ao clicar (ou submit em forms)
// - window.__pbqph.submitLead(payload) faz POST pro webhook configurado e dispara dataLayer
// - UTMs do query string são lidos e injetados automaticamente em qualquer submit

(function () {
  const variant = document.body.dataset.variant || "unknown";

  // ---- Config (sobrescrita externa: window.__pbqph.config.webhookUrl = "...") ----
  const config = {
    webhookUrl: null, // ex: "https://webhook.example/lead"
    debug: false,
  };

  // ---- UTM capture ----
  function readUtms() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach((k) => {
      const v = params.get(k);
      if (v) out[k] = v;
    });
    return out;
  }
  const utms = readUtms();

  // ---- Track helper ----
  function track(event, payload) {
    const data = { event, variant, ...payload, ...utms, ts: Date.now(), page_url: location.href };
    (window.dataLayer = window.dataLayer || []).push(data);
    if (window.VWO && typeof window.VWO.event === "function") window.VWO.event(event, data);
    if (window.optimizely && Array.isArray(window.optimizely)) {
      window.optimizely.push({ type: "event", eventName: event, tags: data });
    }
    if (config.debug) console.log("[track]", event, data);
  }

  // ---- Auto-track de cliques em elementos com data-track ----
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    if (el.tagName === "FORM") return; // form trata no submit
    track(el.dataset.track, { label: el.textContent?.trim().slice(0, 80) });
  });

  // ---- Submit de lead (chamado pelo form.js) ----
  async function submitLead(payload, opts = {}) {
    const source = opts.source || "form";
    const body = { ...payload, ...utms, variant, source, ts: Date.now(), page_url: location.href };
    track(opts.event || "lead_submit", { source });

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

  window.__pbqph = { track, submitLead, config, utms };
})();
