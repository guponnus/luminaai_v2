function initKpiPanel() {
  const panel = document.querySelector("[data-kpi-panel]");
  if (!panel) {
    return;
  }

  const cards = Array.from(panel.querySelectorAll("[data-kpi-card]"));
  const search = panel.querySelector("[data-kpi-search]");
  const panelFilter = panel.querySelector("[data-kpi-panel-filter]");
  const statusButtons = Array.from(panel.querySelectorAll("[data-status]"));
  const shortcuts = Array.from(panel.querySelectorAll("[data-panel-shortcut]"));
  let statusFilter = "all";

  function applyFilters() {
    const query = (search?.value || "").trim().toLowerCase();
    const selectedPanel = panelFilter?.value || "all";

    cards.forEach((card) => {
      const matchesSearch = !query || card.dataset.search.includes(query);
      const matchesPanel = selectedPanel === "all" || card.dataset.panel === selectedPanel;
      const matchesStatus = statusFilter === "all" || card.dataset.status === statusFilter;
      card.hidden = !(matchesSearch && matchesPanel && matchesStatus);
    });
  }

  search?.addEventListener("input", applyFilters);
  panelFilter?.addEventListener("change", applyFilters);

  statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      statusButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      statusFilter = button.dataset.status || "all";
      applyFilters();
    });
  });

  shortcuts.forEach((button) => {
    button.addEventListener("click", () => {
      if (panelFilter) {
        panelFilter.value = button.dataset.panelShortcut || "all";
      }
      applyFilters();
      panel.querySelector(".kpi-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  panel.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-kpi-toggle]");
    if (!toggle) {
      return;
    }
    const card = toggle.closest("[data-kpi-card]");
    const detail = card?.querySelector(".kpi-detail");
    if (!detail) {
      return;
    }
    detail.hidden = !detail.hidden;
    toggle.textContent = detail.hidden ? "Show formula" : "Hide formula";
  });
}

document.addEventListener("DOMContentLoaded", initKpiPanel);
