// ISO 9001 — Variante A — comportamentos específicos
(function () {
  // 1. Logos: clientes ISO 9001
  const track = document.getElementById("logos-track");
  if (track) {
    const logos = [
      "ACIVI.jpg",
      "Agrocontar.jpg",
      "Dominio-Controle.jpg",
      "Enfoque.jpg",
      "Inovatti.jpg",
      "Laborinfor.jpg",
      "Master-Assessoria.jpg",
      "Roncon.jpg",
      "Vilage-Marcas-e-Patentes.jpg",
      "barcelos.jpg",
      "cetti.jpg",
      "cm-advogados.jpg",
      "miranda-feliciano.jpg",
      "sar11.jpg",
    ];
    const html = logos
      .map((src) => `<img src="../../assets/clientes-iso-9001/${encodeURI(src)}" alt="" loading="lazy" decoding="async" width="140" height="44">`)
      .join("");
    track.innerHTML = html + html;
  }

  // 2. Marquees
  ["marquee-tags", "marquee-cities"].forEach((id) => {
    const t = document.getElementById(id);
    if (t) t.innerHTML = t.innerHTML + t.innerHTML;
  });

  // 3. FAQ: apenas um aberto por vez + tracking
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

  // 4. Config webhook
  if (window.__pbqph?.config) {
    window.__pbqph.config.webhookUrl = "https://hook.us1.make.com/g29csjuy9bduidsymp2yeco9oa98u7mh";
    window.__pbqph.config.debug = false;
  }

  // 5. Hamburguer mobile
  const hamburger = document.getElementById("nav-hamburger");
  const drawer = document.getElementById("nav-drawer");
  const drawerClose = document.getElementById("nav-drawer-close");
  function openDrawer() {
    drawer?.classList.add("is-open");
    hamburger?.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    window.__pbqph?.track("nav_drawer_open");
  }
  function closeDrawer() {
    drawer?.classList.remove("is-open");
    hamburger?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }
  hamburger?.addEventListener("click", openDrawer);
  drawerClose?.addEventListener("click", closeDrawer);
  drawer?.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", closeDrawer));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
})();
