// Modal genérico — abre quando clica em [data-modal-open="lead"] e injeta o form.
// Fechamento: clicar no overlay, X, ou ESC.
(function () {
  function ensureModal() {
    let overlay = document.getElementById("lead-modal");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "lead-modal";
    overlay.className = "modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "lead-modal-title");
    overlay.innerHTML = `
      <div class="modal">
        <button type="button" class="modal-close" aria-label="Fechar">×</button>
        <h2 id="lead-modal-title" class="modal-title">Fale com um especialista</h2>
        <p class="modal-subtitle">Preencha abaixo. Resposta em até 1 hora útil.</p>
        <div data-form="lead" data-form-source="modal" data-submit-label="Quero falar com um especialista"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector(".modal-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    // injeta o form
    if (window.__pbqphForm) {
      window.__pbqphForm.buildForm(overlay.querySelector('[data-form="lead"]'), {
        source: "modal",
        event: "form_modal_submit",
        submitLabel: "Quero falar com um especialista",
        onSuccess: () => setTimeout(close, 2200),
      });
    }
    return overlay;
  }

  function open(triggerLabel) {
    const overlay = ensureModal();
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    window.__pbqph?.track("modal_open", { trigger: triggerLabel });
    const firstInput = overlay.querySelector("input, select");
    setTimeout(() => firstInput?.focus(), 50);
  }
  function close() {
    const overlay = document.getElementById("lead-modal");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-modal-open='lead']");
    if (!trigger) return;
    e.preventDefault();
    open(trigger.textContent?.trim().slice(0, 80));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.__pbqphModal = { open, close };
})();
