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
    const html = list.map((src) => `<img src="../../assets/clientes/${encodeURI(src)}" alt="" loading="lazy" decoding="async" width="140" height="44">`).join("");
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

  // 3. Config webhook Make.com
  if (window.__pbqph?.config) {
    window.__pbqph.config.webhookUrl = "https://hook.us1.make.com/g29csjuy9bduidsymp2yeco9oa98u7mh";
    window.__pbqph.config.debug = false;
  }

  // 4. Hamburguer mobile — abre/fecha drawer
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
