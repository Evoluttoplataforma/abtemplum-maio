// Variante A — comportamentos específicos
(function () {
  // 1. Logos: popula a track e duplica para loop infinito
  const track = document.getElementById("logos-track");
  if (track) {
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
    const html = logos
      .map((src) => `<img src="../assets/clientes/${encodeURI(src)}" alt="" loading="lazy">`)
      .join("");
    track.innerHTML = html + html;
  }

  // 2. Marquees: duplica conteúdo pra loop contínuo
  ["marquee-tags", "marquee-cities"].forEach((id) => {
    const t = document.getElementById(id);
    if (t) t.innerHTML = t.innerHTML + t.innerHTML;
  });

  // 3. FAQ: garante apenas um aberto por vez + tracking
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

  // 4. Config inicial — webhook Make.com
  if (window.__pbqph?.config) {
    window.__pbqph.config.webhookUrl = "https://hook.us1.make.com/g29csjuy9bduidsymp2yeco9oa98u7mh";
    window.__pbqph.config.debug = false;
  }
})();
