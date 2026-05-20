// ISO 27001 — Variante B
(function () {
  const logos = [
    "tabelionado-bh.png",
    "compliance-solucoes.png",
    "kpeyes.webp",
    "oficio-distribuidor-protesto.webp",
    "logo-protestos.webp",
    "gd-logo.svg",
    "cliente-iso27-01.png",
    "cliente-iso27-02.png",
  ];
  const buildTrack = (id, list) => {
    const t = document.getElementById(id);
    if (!t) return;
    const html = list.map((src) => `<img src="../../assets/clientes-iso-27001/${encodeURI(src)}" alt="" loading="lazy" decoding="async" width="140" height="44">`).join("");
    t.innerHTML = html + html + html;
  };

  buildTrack("logos-track-1", logos);
  buildTrack("logos-track-2", [...logos].reverse());

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

  if (window.__pbqph?.config) {
    window.__pbqph.config.webhookUrl = "https://hook.us1.make.com/g29csjuy9bduidsymp2yeco9oa98u7mh";
    window.__pbqph.config.debug = false;
  }

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
