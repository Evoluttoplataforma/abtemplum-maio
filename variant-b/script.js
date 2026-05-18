// Variante B — comportamentos específicos
(function () {
  const logos = [
    "ACS-Construtora (1).jpg",
    "Carvalho-Forte.jpg",
    "Cidade-Engenharia.jpg",
    "Const.-Helevar.jpg",
    "Construtora-Monte-Belo.jpg",
    "Dottore-Parro.jpg",
    "Gencons.jpg",
    "Kraide.jpg",
    "Parteng.jpg",
    "bm.jpeg",
    "brastar.jpeg",
    "casa noibre itajai.png",
    "lajeresk.png",
    "oportuna.jpg",
    "solidez desenvolvimento urbano.png",
    "villaramos.jpg",
  ];
  const buildTrack = (id, list) => {
    const t = document.getElementById(id);
    if (!t) return;
    const html = list.map((src) => `<img src="../assets/clientes/${encodeURI(src)}" alt="" loading="lazy">`).join("");
    t.innerHTML = html + html;
  };

  // 1. Logos em 2 blocos diferentes (mesmas imagens em ordens diferentes pra variar visualmente)
  buildTrack("logos-track-1", logos);
  buildTrack("logos-track-2", [...logos].reverse());

  // 2. FAQ: só um aberto por vez + tracking
  document.querySelectorAll(".faq-item").forEach((el) => {
    el.addEventListener("toggle", () => {
      if (el.open) {
        document.querySelectorAll(".faq-item[open]").forEach((other) => {
          if (other !== el) other.open = false;
        });
        window.__pbqph?.track("faq_open", { question: el.querySelector(".faq-question")?.textContent?.trim().slice(0, 80) });
      }
    });
  });

  // 3. Config webhook (configurar antes de publicar)
  if (window.__pbqph?.config) {
    window.__pbqph.config.webhookUrl = null;
    window.__pbqph.config.debug = false;
  }
})();
