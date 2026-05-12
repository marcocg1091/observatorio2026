
(function () {
  "use strict";

  /* =========================================================
     MENÚ MÓVIL
  ========================================================= */
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileNav = document.getElementById("mobile-nav");
  const menuLabel = document.querySelector(".site-header__menu-label");
  const dropdownBtn = document.getElementById("btn-servicios");
  const dropdownPanel = document.getElementById("menu-servicios");
  const MQ_DESKTOP = window.matchMedia("(min-width: 960px)");

  function setMobileNavOpen(open) {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    mobileNav.hidden = !open;
    document.body.classList.toggle("is-nav-open", open);
    if (menuLabel) menuLabel.textContent = open ? "Cerrar menú" : "Abrir menú";
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      const open = menuBtn.getAttribute("aria-expanded") === "true";
      setMobileNavOpen(!open);
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMobileNavOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setMobileNavOpen(false);
        menuBtn.focus();
      }
    });
    function onViewportChange() { if (MQ_DESKTOP.matches) setMobileNavOpen(false); }
    if (typeof MQ_DESKTOP.addEventListener === "function") MQ_DESKTOP.addEventListener("change", onViewportChange);
    else MQ_DESKTOP.addListener(onViewportChange);
  }

  /* =========================================================
     DROPDOWN SERVICIOS ANALÍTICOS
  ========================================================= */
  if (dropdownBtn && dropdownPanel) {
    const dropdownRoot = dropdownBtn.closest(".nav-dropdown");
    if (dropdownRoot) {
      function setDropdownOpen(open) {
        dropdownBtn.setAttribute("aria-expanded", open ? "true" : "false");
        dropdownPanel.hidden = !open;
      }
      setDropdownOpen(false);
      dropdownRoot.addEventListener("mouseenter", function () { setDropdownOpen(true); });
      dropdownRoot.addEventListener("mouseleave", function () { setDropdownOpen(false); });
      dropdownRoot.addEventListener("focusin", function () { setDropdownOpen(true); });
      dropdownRoot.addEventListener("focusout", function (e) {
        if (!dropdownRoot.contains(e.relatedTarget)) setDropdownOpen(false);
      });
      dropdownBtn.addEventListener("click", function () {
        const open = dropdownBtn.getAttribute("aria-expanded") === "true";
        setDropdownOpen(!open);
      });
      dropdownBtn.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); setDropdownOpen(false); dropdownBtn.focus(); }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setDropdownOpen(true);
          const firstLink = dropdownPanel.querySelector("a");
          if (firstLink) firstLink.focus();
        }
      });
      dropdownPanel.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); setDropdownOpen(false); dropdownBtn.focus(); }
      });
      document.addEventListener("click", function (e) {
        if (!dropdownRoot.contains(e.target)) setDropdownOpen(false);
      });
    }
  }

  /* =========================================================
     FECHA Y HORA DE CARGA DEL DASHBOARD
  ========================================================= */
  function setDashboardLoadDates() {
    const dashboardLoadDates = document.querySelectorAll("[data-dashboard-load-date]");
    if (!dashboardLoadDates.length) return;
    const now = new Date();
    const formattedDate = now.toLocaleString("es-PE", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    dashboardLoadDates.forEach(function (element) { element.textContent = formattedDate; });
  }

  /* =========================================================
     DASHBOARDS EMBEBIDOS TABLEAU / POWER BI
     Permite cargar iframe desde data-dashboard-src cuando exista.
  ========================================================= */
  function initEmbeddedDashboards() {
    const dashboardFrames = document.querySelectorAll("[data-dashboard-src]");
    dashboardFrames.forEach(function (container) {
      const dashboardUrl = container.getAttribute("data-dashboard-src");
      const dashboardTitle = container.getAttribute("data-dashboard-title") || "Dashboard del Observatorio";
      const dashboardType = container.getAttribute("data-dashboard-type") || "dashboard";
      if (!dashboardUrl || dashboardUrl.trim() === "" || dashboardUrl.includes("URL_DASHBOARD")) {
        container.innerHTML = `
          <div class="dashboard-error-state" role="status">
            <h3>Dashboard en proceso de actualización</h3>
            <p>Este tablero estará disponible próximamente. Mientras tanto, puedes revisar los indicadores principales, la narrativa explicativa y la metodología del módulo.</p>
          </div>`;
        return;
      }
      container.innerHTML = `
        <iframe
          src="${escapeAttr(dashboardUrl)}"
          title="${escapeAttr(dashboardTitle)}"
          loading="lazy"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
          data-dashboard-type="${escapeAttr(dashboardType)}">
        </iframe>`;
    });
  }

  function initDashboardFallbackTimer() {
    document.querySelectorAll(".dashboard-frame iframe").forEach(function (iframe) {
      const container = iframe.closest(".dashboard-frame");
      if (!container) return;
      let loaded = false;
      iframe.addEventListener("load", function () {
        loaded = true;
        container.classList.add("dashboard-loaded");
      });
      setTimeout(function () {
        if (!loaded) container.classList.add("dashboard-loading-slow");
      }, 8000);
    });
  }

  /* =========================================================
     TOOLTIP NARRATIVO PARA GRÁFICOS, RANKINGS Y KPIs
  ========================================================= */
  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeAttr(value) { return escapeHTML(value).replace(/`/g, "&#96;"); }
  function cleanText(value) { return String(value || "").replace(/\s+/g, " ").trim(); }

  function textOf(root, selector) {
    const el = root.querySelector(selector);
    return el ? cleanText(el.textContent) : "";
  }

  function nearestTitle(el) {
    const scope = el.closest(".chart-card, .sec-block, .side-card, .dashboard-section, .insight-panel, .semaforo-box, .funnel-box, section, .narrative-header");
    if (!scope) return "Indicador del Observatorio";
    const heading = scope.querySelector("h2, h3, .side-card-title, .funnel-title, .sem-title");
    return heading ? cleanText(heading.textContent) : "Indicador del Observatorio";
  }

  function moduleName() {
    const h1 = document.querySelector("h1, .nh-title, .hero-title");
    return h1 ? cleanText(h1.textContent) : "Observatorio de Contrataciones Públicas";
  }

  function buildTooltipData(el) {
    let title = el.dataset.title || el.dataset.region || el.dataset.name || "";
    let value = el.dataset.value || "";
    let indicator = el.dataset.indicator || "";
    let description = el.dataset.description || "";
    let period = el.dataset.period || "Periodo seleccionado";
    let source = el.dataset.source || "DWH / Cubos analíticos DGDIC";

    if (!title) {
      title = textOf(el, ".rank-name") || textOf(el, ".hbar-lbl") || textOf(el, ".kpi-eye") || textOf(el, ".k5-q") || textOf(el, ".hero-kpi-label") || textOf(el, ".ic-val") || textOf(el, ".actor-tab-label") || textOf(el, ".sem-label") || textOf(el, ".funnel-lbl") || cleanText(el.textContent).slice(0, 90);
    }
    if (!value) {
      value = textOf(el, ".rank-val") || textOf(el, ".hbar-val") || textOf(el, ".kpi-val") || textOf(el, ".k5-val") || textOf(el, ".hero-kpi-val") || textOf(el, ".ic-sub") || textOf(el, ".funnel-val") || textOf(el, ".funnel-pct") || "";
    }
    if (!indicator) indicator = nearestTitle(el);

    if (!description) {
      if (el.classList.contains("rank-row")) {
        description = "Este ranking permite comparar posiciones relativas según el indicador seleccionado. Úsalo como una señal analítica, no como una calificación definitiva.";
      } else if (el.classList.contains("hbar-row")) {
        description = "La barra muestra la magnitud relativa del valor frente a las demás categorías visibles en el gráfico.";
      } else if (el.classList.contains("kpi-c") || el.classList.contains("kpi5-item") || el.classList.contains("hero-kpi-item") || el.classList.contains("insight-card")) {
        description = "Este indicador resume una lectura clave del módulo y debe interpretarse junto con el periodo, filtros aplicados y metodología DGDIC.";
      } else if (el.classList.contains("funnel-step")) {
        description = "Esta etapa muestra cuántos actores avanzan dentro del flujo analítico. Las diferencias entre etapas ayudan a identificar oportunidades de mejora.";
      } else if (el.classList.contains("sem-card")) {
        description = "Este estado ayuda a interpretar el nivel de atención requerido según el comportamiento del indicador.";
      } else if (el.classList.contains("map-region")) {
        description = "Esta región del mapa permite interpretar territorialmente el indicador seleccionado. Compare el valor con otras regiones y revise filtros antes de sacar conclusiones.";
      } else if (el.classList.contains("map-city-marker")) {
        description = "Marcador visual de referencia territorial. Use las regiones coloreadas para consultar valores del indicador seleccionado.";
      } else if (el.classList.contains("map-tab")) {
        description = "Selecciona esta vista para cambiar la lectura del mapa según el tipo de monto que deseas analizar.";
      } else {
        description = "Este elemento brinda contexto para comprender mejor la información presentada en el Observatorio.";
      }
    }

    return { title, value, indicator, description, period, source };
  }

  function initNarrativeTooltips() {
    const selector = [
      "[data-tooltip-chart]",
      ".rank-row",
      ".hbar-row",
      ".kpi-c",
      ".kpi5-item",
      ".hero-kpi-item",
      ".insight-card",
      ".funnel-step",
      ".sem-card",
      ".actor-tab",
      ".map-tab",
      ".map-region",
      ".map-city-marker"
    ].join(",");

    const elements = Array.from(document.querySelectorAll(selector))
      .filter(function (el) { return !el.closest(".chart-tooltip") && el.offsetParent !== null; });

    if (!elements.length) return;

    let tooltip = document.querySelector(".chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "chart-tooltip";
      tooltip.setAttribute("role", "tooltip");
      tooltip.id = "chart-tooltip-global";
      document.body.appendChild(tooltip);
    }

    function showTooltip(event, el) {
      const data = buildTooltipData(el);
      tooltip.innerHTML = `
        <div class="chart-tooltip__title">${escapeHTML(data.title)}</div>
        ${data.value ? `<div class="chart-tooltip__value">${escapeHTML(data.value)} · ${escapeHTML(data.indicator)}</div>` : `<div class="chart-tooltip__value">${escapeHTML(data.indicator)}</div>`}
        <div class="chart-tooltip__desc">${escapeHTML(data.description)}</div>
        <div class="chart-tooltip__meta">Periodo: ${escapeHTML(data.period)}<br>Fuente: ${escapeHTML(data.source)}</div>`;
      positionTooltip(event, el);
      tooltip.classList.add("is-visible");
      el.setAttribute("aria-describedby", "chart-tooltip-global");
    }

    function positionTooltip(event, el) {
      let x = event && event.clientX;
      let y = event && event.clientY;
      if (!x || !y) {
        const rect = el.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + 8;
      }
      const margin = 16;
      x = Math.max(margin, Math.min(window.innerWidth - margin, x));
      y = Math.max(70, Math.min(window.innerHeight - margin, y));
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
    }

    function hideTooltip(el) {
      tooltip.classList.remove("is-visible");
      if (el) el.removeAttribute("aria-describedby");
    }

    elements.forEach(function (el) {
      if (el.dataset.tooltipReady === "true") return;
      el.dataset.tooltipReady = "true";
      if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
        el.setAttribute("tabindex", "0");
      }
      el.setAttribute("data-tooltip-chart", "");
      el.addEventListener("mouseenter", function (event) { showTooltip(event, el); });
      el.addEventListener("mousemove", function (event) { positionTooltip(event, el); });
      el.addEventListener("mouseleave", function () { hideTooltip(el); });
      el.addEventListener("focus", function (event) { showTooltip(event, el); });
      el.addEventListener("blur", function () { hideTooltip(el); });
      el.addEventListener("keydown", function (event) {
        if (event.key === "Escape") hideTooltip(el);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setDashboardLoadDates();
    initEmbeddedDashboards();
    initDashboardFallbackTimer();
    if (typeof setMapTab === "function") setMapTab("conv");
    initNarrativeTooltips();
  });
})();
