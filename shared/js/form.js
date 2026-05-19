// Componente de formulário PBQP-H — comportamento compartilhado.
// 1. Renderiza HTML do form em qualquer container com data-form="lead" (ou injeta no modal)
// 2. Validação + máscara de WhatsApp
// 3. Submit via window.__pbqph.submitLead

(function () {
  const FORM_FIELDS_HTML = `
    <div class="form-field form-field--full" data-field="name">
      <label for="{id}-name">Nome completo</label>
      <input id="{id}-name" name="name" type="text" autocomplete="name" required minlength="3" placeholder="Como podemos te chamar?">
      <span class="field-error">Informe seu nome completo</span>
    </div>
    <div class="form-field" data-field="email">
      <label for="{id}-email">E-mail corporativo</label>
      <input id="{id}-email" name="email" type="email" autocomplete="email" required placeholder="voce@suaconstrutora.com.br">
      <span class="field-error">Informe um e-mail válido</span>
    </div>
    <div class="form-field" data-field="whatsapp">
      <label for="{id}-whatsapp">WhatsApp</label>
      <input id="{id}-whatsapp" name="whatsapp" type="tel" autocomplete="tel" required inputmode="numeric" placeholder="(11) 99999-9999" maxlength="15">
      <span class="field-error">Informe um WhatsApp com DDD</span>
    </div>
    <div class="form-field form-field--full" data-field="empresa">
      <label for="{id}-empresa">Nome da construtora</label>
      <input id="{id}-empresa" name="empresa" type="text" autocomplete="organization" required minlength="2" placeholder="Razão social ou nome fantasia">
      <span class="field-error">Informe o nome da empresa</span>
    </div>
    <div class="form-field" data-field="funcionarios">
      <label for="{id}-funcionarios">Faixa de funcionários</label>
      <select id="{id}-funcionarios" name="funcionarios" required>
        <option value="">Selecione...</option>
        <option value="1 a 9">1 a 9</option>
        <option value="10 a 49">10 a 49</option>
        <option value="50 a 99">50 a 99</option>
        <option value="100 a 249">100 a 249</option>
        <option value="250 a 499">250 a 499</option>
        <option value="500 ou mais">500 ou mais</option>
      </select>
      <span class="field-error">Escolha a faixa de funcionários</span>
    </div>
    <div class="form-field" data-field="faturamento">
      <label for="{id}-faturamento">Faturamento anual</label>
      <select id="{id}-faturamento" name="faturamento" required>
        <option value="">Selecione...</option>
        <option value="Até R$ 500 mil">Até R$ 500 mil</option>
        <option value="R$ 500 mil a R$ 2 milhões">R$ 500 mil a R$ 2 milhões</option>
        <option value="R$ 2 milhões a R$ 10 milhões">R$ 2 milhões a R$ 10 milhões</option>
        <option value="R$ 10 milhões a R$ 50 milhões">R$ 10 milhões a R$ 50 milhões</option>
        <option value="Acima de R$ 50 milhões">Acima de R$ 50 milhões</option>
      </select>
      <span class="field-error">Escolha a faixa de faturamento</span>
    </div>
  `;

  function maskWhatsapp(v) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? "(" + digits : "";
    if (digits.length <= 7) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }

  function attachWhatsappMask(input) {
    input.addEventListener("input", () => {
      const start = input.selectionStart;
      const before = input.value;
      input.value = maskWhatsapp(input.value);
      // ajuste de cursor para não saltar
      if (input.value.length > before.length) input.setSelectionRange(start + (input.value.length - before.length), start + (input.value.length - before.length));
    });
  }

  function validateField(field) {
    const input = field.querySelector("input, select");
    if (!input) return true;
    const value = input.value.trim();
    let valid = input.checkValidity();
    if (input.name === "whatsapp") {
      const digits = value.replace(/\D/g, "");
      valid = digits.length >= 10 && digits.length <= 11;
    }
    field.classList.toggle("has-error", !valid);
    return valid;
  }

  function buildForm(container, opts = {}) {
    const source = opts.source || container.dataset.formSource || "inline";
    const event = opts.event || (source === "modal" ? "form_modal_submit" : "form_inline_submit");
    const formId = opts.formId || container.dataset.formId || (source === "inline" ? "waitlist-form" : "waitlist-form-" + source);
    const id = "f-" + Math.random().toString(36).slice(2, 8);
    const submitLabel = opts.submitLabel || container.dataset.submitLabel || "Quero minha consultoria gratuita";

    const fieldsHtml = FORM_FIELDS_HTML.replace(/\{id\}/g, id);
    container.innerHTML = `
      <form class="form" id="${formId}" novalidate data-track="${event}">
        ${fieldsHtml}
        <button type="submit" class="btn btn--primary btn--lg btn--block">
          <span class="btn-label">${submitLabel}</span>
          <iconify-icon icon="solar:arrow-right-linear" aria-hidden="true"></iconify-icon>
        </button>
        <p class="form-status" role="status" aria-live="polite"></p>
        <p class="form-disclaimer">Seus dados estão seguros. Sem spam, sem compromisso.</p>
      </form>
    `;

    const form = container.querySelector("form");
    const whatsappInput = form.querySelector('input[name="whatsapp"]');
    attachWhatsappMask(whatsappInput);

    form.querySelectorAll(".form-field").forEach((field) => {
      const input = field.querySelector("input, select");
      input.addEventListener("blur", () => validateField(field));
      input.addEventListener("input", () => {
        if (field.classList.contains("has-error")) validateField(field);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = [...form.querySelectorAll(".form-field")];
      const allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
        const firstError = form.querySelector(".form-field.has-error input, .form-field.has-error select");
        firstError?.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      const btn = form.querySelector('button[type="submit"]');
      const status = form.querySelector(".form-status");
      const originalLabel = btn.querySelector(".btn-label").textContent;
      btn.disabled = true;
      btn.querySelector(".btn-label").textContent = "Enviando...";
      status.className = "form-status";
      status.textContent = "";

      const result = await window.__pbqph.submitLead(data, { source, event });

      if (result.ok) {
        status.className = "form-status success";
        status.textContent = result.simulated
          ? "Recebido! (modo demo — sem webhook configurado)"
          : "Redirecionando...";

        // Detecta a norma a partir do path (pbqp-h, iso-9001, iso-27001...)
        const pathSeg = (location.pathname.split("/")[1] || "").toLowerCase();
        const NORM_MAP = { "pbqp-h": "PBQP-H", "iso-9001": "ISO 9001", "iso-27001": "ISO 27001" };
        const normSlug = NORM_MAP[pathSeg] ? pathSeg : "";
        const normLabel = NORM_MAP[pathSeg] || "";

        // Salva os dados pro funil da live na página de obrigado
        try {
          sessionStorage.setItem("__pbqph_lastlead", JSON.stringify({
            name: data.name || "",
            firstname: (data.name || "").trim().split(/\s+/)[0] || "",
            lastname: (data.name || "").trim().split(/\s+/).slice(1).join(" ") || "",
            email: data.email || "",
            whatsapp: data.whatsapp || "",
            empresa: data.empresa || "",
            funcionarios: data.funcionarios || "",
            faturamento: data.faturamento || "",
            norm_slug: normSlug,
            norm_label: normLabel,
            variant: document.body.dataset.variant || "",
            ts: Date.now()
          }));
        } catch (e) { /* sessionStorage cheio/bloqueado: ignora */ }

        form.reset();
        opts.onSuccess?.(data);
        // Redireciona pra página de obrigado preservando query string (UTMs/click IDs)
        if (!result.simulated) {
          const thanksUrl = "/obrigado/" + (window.location.search || "");
          setTimeout(function () { window.location.href = thanksUrl; }, 350);
          return;
        }
      } else {
        status.className = "form-status error";
        status.textContent = "Não conseguimos enviar. Tente novamente em alguns segundos.";
      }

      btn.disabled = false;
      btn.querySelector(".btn-label").textContent = originalLabel;
    });

    return form;
  }

  // Auto-init: qualquer container com data-form="lead" recebe o form
  function init() {
    document.querySelectorAll('[data-form="lead"]').forEach((c) => buildForm(c));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.__pbqphForm = { buildForm };
})();
