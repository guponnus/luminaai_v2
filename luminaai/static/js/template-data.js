(function () {
  const cfg = window.LUMINAAI_DATA;
  if (!cfg) {
    return;
  }

  function number(value) {
    return new Intl.NumberFormat().format(value || 0);
  }

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .luminaai-panel-tools{display:flex;justify-content:flex-end;gap:8px;margin:0 0 12px}
      .panel-content > .mvp-embedded > .panel-header{display:none!important}
      .luminaai-detail-btn{background:#0D2D52;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 6px 16px rgba(13,45,82,.18)}
      .luminaai-detail-btn:hover{background:#00B4A6}
      .luminaai-related-strip{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:10px 12px;margin:0 0 14px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
      .luminaai-related-title{display:flex;align-items:center;gap:7px;color:#0D2D52;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px}
      .luminaai-related-chips{display:flex;flex-wrap:wrap;gap:7px}
      .luminaai-entity-chip{display:inline-flex;align-items:center;gap:6px;background:#EBF5FF;color:#0D2D52;border:1px solid #BEE3F8;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:800;cursor:pointer}
      .luminaai-entity-chip:hover{background:#00B4A6;color:#fff;border-color:#00B4A6}
      .luminaai-kpi-icon{width:28px;height:28px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;background:#EBF5FF;color:#0D2D52;font-size:15px;margin-bottom:8px}
      .luminaai-modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.68);z-index:100000;display:none;align-items:center;justify-content:center;padding:22px}
      .luminaai-modal-backdrop.open{display:flex}
      .luminaai-modal{background:#fff;color:#172033;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.35);width:min(1180px,96vw);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;font-family:Segoe UI,Arial,sans-serif}
      .luminaai-modal-hd{background:linear-gradient(135deg,#0D2D52,#1A8FE3);color:#fff;padding:18px 22px;display:flex;align-items:flex-start;gap:16px;justify-content:space-between}
      .luminaai-modal-hd h2{font-size:18px;margin:0 0 4px}.luminaai-modal-hd p{font-size:12px;margin:0;color:#dbeafe}
      .luminaai-modal-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .luminaai-modal-actions button,.luminaai-close{border:0;border-radius:8px;padding:8px 11px;font-size:11px;font-weight:800;cursor:pointer}
      .luminaai-modal-actions button{background:#fff;color:#0D2D52}.luminaai-close{background:#E53E3E;color:#fff}
      .luminaai-modal-body{padding:18px 22px;overflow:auto}
      .luminaai-modal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:18px}
      .luminaai-modal-card{border:1px solid #E2E8F0;border-left:4px solid #00B4A6;border-radius:10px;padding:10px;background:#F8FAFC}
      .luminaai-modal-card strong{display:block;font-size:17px;color:#0D2D52}.luminaai-modal-card span{display:block;font-size:11px;color:#667085;margin-top:3px}
      .luminaai-modal-section{margin-bottom:20px}.luminaai-modal-section h3{font-size:13px;color:#0D2D52;margin:0 0 10px;text-transform:uppercase;letter-spacing:.5px}
      .luminaai-modal-table-wrap{overflow:auto;border:1px solid #E2E8F0;border-radius:10px;max-height:320px}
      .luminaai-modal table{width:100%;border-collapse:collapse;font-size:12px}.luminaai-modal th{background:#EDF2F7;color:#667085;text-align:left;padding:8px;white-space:nowrap}.luminaai-modal td{padding:7px 8px;border-top:1px solid #E2E8F0;white-space:nowrap}
      .luminaai-empty{color:#667085;font-size:13px;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:10px;padding:14px}
      .luminaai-entity-link{color:#0D2D52;font-weight:800;text-decoration:underline;text-decoration-style:dotted;cursor:context-menu}
      .luminaai-context-menu{position:fixed;z-index:100001;display:none;background:#fff;color:#172033;border:1px solid #CBD5E1;border-radius:12px;box-shadow:0 18px 44px rgba(2,6,23,.25);min-width:230px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif}
      .luminaai-context-menu.open{display:block}
      .luminaai-context-head{background:#0D2D52;color:#fff;padding:10px 12px;font-size:12px;font-weight:900}
      .luminaai-context-menu button{display:block;width:100%;border:0;background:#fff;color:#172033;text-align:left;padding:10px 12px;font-size:12px;font-weight:700;cursor:pointer}
      .luminaai-context-menu button:hover{background:#EBF5FF;color:#0D2D52}
    `;
    document.head.appendChild(style);
  }

  function text(node) {
    return (node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function activePillarName(panel) {
    const pillar = panel.closest(".pillar-section");
    return text(pillar?.querySelector(".pillar-name")) || cfg.activeTemplate || "Luminaai";
  }

  function panelTitle(panel) {
    const id = panel.id || "";
    const letter = id.split("_")[1] || "";
    const tab = panel.closest(".pillar-section")?.querySelector(`.panel-tab[data-panel="${letter}"]`);
    return text(tab) || text(panel.querySelector(".panel-title")) || id || "Panel";
  }

  function chartRows(panel) {
    const rows = [];
    panel.querySelectorAll("canvas").forEach((canvas) => {
      const chart = window.Chart?.getChart ? window.Chart.getChart(canvas) : null;
      if (!chart) {
        rows.push({ Section: "Chart", Item: canvas.id || "canvas", Metric: "Canvas", Value: "Rendered chart" });
        return;
      }
      const labels = chart.data?.labels || [];
      (chart.data?.datasets || []).forEach((dataset) => {
        (dataset.data || []).forEach((value, index) => {
          rows.push({
            Section: "Chart",
            Item: canvas.id || "chart",
            Metric: `${dataset.label || "Series"} - ${labels[index] ?? index + 1}`,
            Value: value,
          });
        });
      });
    });
    return rows;
  }

  function tableRows(panel) {
    const tables = [];
    panel.querySelectorAll("table").forEach((table, index) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map(text);
      const fallbackHeaders = Array.from(table.querySelectorAll("tr:first-child th, tr:first-child td")).map(text);
      const finalHeaders = headers.length ? headers : fallbackHeaders;
      const bodyRows = Array.from(table.querySelectorAll("tbody tr")).length
        ? Array.from(table.querySelectorAll("tbody tr"))
        : Array.from(table.querySelectorAll("tr")).slice(1);
      const rows = bodyRows.map((row) => {
        const values = Array.from(row.children).map(text);
        return Object.fromEntries(values.map((value, cellIndex) => [finalHeaders[cellIndex] || `Column ${cellIndex + 1}`, value]));
      });
      if (rows.length) {
        tables.push({ title: text(table.closest(".table-card,.table-box,.card,.full-card")?.querySelector(".table-title,h3")) || `Table ${index + 1}`, rows });
      }
    });
    return tables;
  }

  function kpiRows(panel) {
    const rows = [];
    panel.querySelectorAll(".kpi,.kpi-card,.gauge-card,.gauge-item,.info-card").forEach((card, index) => {
      const label = text(card.querySelector(".label,label,.kpi-label,.gauge-label,.info-title")) || `Card ${index + 1}`;
      const value = text(card.querySelector(".value,.val,.kpi-value,.kpi-val,.gauge-value,.gauge-val")) || text(card);
      const sub = text(card.querySelector(".sub,.kpi-sub,.gauge-target"));
      rows.push({ Section: "KPI", Item: label, Metric: sub || "Value", Value: value });
    });
    return rows;
  }

  function collectPanelRows(panel) {
    const rows = [
      { Section: "Panel", Item: activePillarName(panel), Metric: "Panel", Value: panelTitle(panel) },
      ...kpiRows(panel),
      ...chartRows(panel),
    ];
    tableRows(panel).forEach((table) => {
      table.rows.forEach((row, index) => {
        Object.entries(row).forEach(([metric, value]) => {
          rows.push({ Section: "Table", Item: `${table.title} Row ${index + 1}`, Metric: metric, Value: value });
        });
      });
    });
    return rows;
  }

  function panelWorkbookCode(panel) {
    const match = (panel.id || "").match(/^(\d{2})_/);
    return match ? `F${match[1]}` : null;
  }

  function entityPattern() {
    return /\b(AST-\d{4,}|ALT-\d{6}|ALT-F\d{2}-\d{4}|WO-\d{5,}|WO-FS-\d{4}|LR-\d{6}|FC-\d{6}|BG-\d{6}|ACC-\d{4,}|MTR-F\d{2}-\d{4}|EXC-F\d{2}-\d{4}|TMR-F\d{2}-\d{4}|HSP-F\d{2}-\d{4}|REC-F\d{2}-\d{4}|ACT-F\d{2}-\d{4})\b/i;
  }

  function extractEntityId(value) {
    const match = String(value || "").match(entityPattern());
    return match ? match[1] : null;
  }

  function pillarForPanelCode(panelCode) {
    const match = String(panelCode || "").match(/^F?(\d{2})$/i);
    return match ? match[1] : null;
  }

  function workbookExportRows(workbook) {
    if (!workbook?.records?.length) {
      return [];
    }
    return workbook.records.flatMap((record, index) =>
      Object.entries(record).map(([metric, value]) => ({
        Section: "Master Workbook",
        Item: `${workbook.sheetName} Row ${index + 1}`,
        Metric: metric,
        Value: value ?? "",
      }))
    );
  }

  function fetchWorkbookRows(panel) {
    const code = panelWorkbookCode(panel);
    if (!code) {
      return Promise.resolve(null);
    }
    window.LUMINAAI_WORKBOOK_CACHE = window.LUMINAAI_WORKBOOK_CACHE || {};
    if (window.LUMINAAI_WORKBOOK_CACHE[code]) {
      return Promise.resolve(window.LUMINAAI_WORKBOOK_CACHE[code]);
    }
    return fetch(`/api/datasets/panel/${code}?limit=1000`)
      .then((response) => (response.ok ? response.json() : null))
      .then((workbook) => {
        if (workbook) {
          window.LUMINAAI_WORKBOOK_CACHE[code] = workbook;
        }
        return workbook;
      })
      .catch(() => null);
  }

  function iconForText(value) {
    const lower = String(value || "").toLowerCase();
    if (lower.includes("asset") || lower.includes("health")) return "🏗️";
    if (lower.includes("alert") || lower.includes("failure") || lower.includes("risk")) return "⚡";
    if (lower.includes("work") || lower.includes("crew") || lower.includes("safety")) return "🦺";
    if (lower.includes("loss") || lower.includes("water") || lower.includes("nrw")) return "💧";
    if (lower.includes("forecast") || lower.includes("mape") || lower.includes("demand")) return "📈";
    if (lower.includes("bill") || lower.includes("revenue") || lower.includes("account") || lower.includes("meter")) return "💰";
    if (lower.includes("cost") || lower.includes("capex") || lower.includes("roi")) return "💹";
    if (lower.includes("compliance") || lower.includes("audit")) return "🛡️";
    return "◆";
  }

  function addKpiIcons(panel) {
    panel.querySelectorAll(".kpi,.kpi-card,.gauge-card,.gauge-item,.info-card").forEach((card) => {
      if (card.querySelector(".luminaai-kpi-icon")) {
        return;
      }
      const label = text(card.querySelector(".label,label,.kpi-label,.gauge-label,.info-title")) || text(card);
      const icon = document.createElement("span");
      icon.className = "luminaai-kpi-icon";
      icon.textContent = iconForText(label);
      card.prepend(icon);
    });
  }

  function entityTypeLabel(entityId) {
    if (entityId.startsWith("AST-")) return "Asset";
    if (entityId.startsWith("ALT-")) return "Alert";
    if (entityId.startsWith("WO-")) return "Work Order";
    if (entityId.startsWith("ACC-")) return "Account";
    if (entityId.startsWith("BG-")) return "Billing";
    if (entityId.startsWith("FC-")) return "Forecast";
    if (entityId.startsWith("LR-")) return "Loss";
    return "Entity";
  }

  function entityIcon(entityId) {
    return iconForText(entityTypeLabel(entityId));
  }

  function extractWorkbookEntities(workbook) {
    if (!workbook?.records?.length) {
      return [];
    }
    const entities = [];
    const seen = new Set();
    workbook.records.slice(0, 80).forEach((record) => {
      Object.values(record).forEach((value) => {
        const entityId = extractEntityId(value);
        if (entityId && !seen.has(entityId)) {
          seen.add(entityId);
          entities.push(entityId);
        }
      });
    });
    return entities.slice(0, 12);
  }

  function addRelatedEntities(panel, workbook) {
    if (panel.querySelector(".luminaai-related-strip") || !workbook) {
      return;
    }
    const entities = extractWorkbookEntities(workbook);
    if (!entities.length) {
      return;
    }
    const strip = document.createElement("div");
    strip.className = "luminaai-related-strip";
    strip.innerHTML = `
      <div class="luminaai-related-title"><span>${iconForText(activePillarName(panel))}</span><span>Related entities - click for navigation</span></div>
      <div class="luminaai-related-chips">
        ${entities
          .map(
            (entityId) =>
              `<button type="button" class="luminaai-entity-chip luminaai-entity-link" data-entity-id="${entityId}"><span>${entityIcon(entityId)}</span>${entityId}</button>`
          )
          .join("")}
      </div>
    `;
    const tools = panel.querySelector(".luminaai-panel-tools");
    tools.insertAdjacentElement("afterend", strip);
  }

  function escapeCsv(value) {
    const raw = String(value ?? "");
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  }

  function downloadCsv(filename, rows) {
    const headers = Object.keys(rows[0] || { Section: "", Item: "", Metric: "", Value: "" });
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function downloadXlsx(filename, rows) {
    fetch("/api/export/xlsx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, rows }),
    })
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  function workbookTableHtml(workbook) {
    if (!workbook?.records?.length) {
      return '<div class="luminaai-empty">No master workbook rows were available for this panel.</div>';
    }
    const headers = Object.keys(workbook.records[0] || {});
    const previewRows = workbook.records.slice(0, 100);
    return `<section class="luminaai-modal-section"><h3>${workbook.sheetName} - Master Workbook Data (${number(workbook.recordCount)} rows)</h3><div class="luminaai-modal-table-wrap"><table><thead><tr>${headers
      .map((header) => `<th>${header}</th>`)
      .join("")}</tr></thead><tbody>${previewRows
      .map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div></section>`;
  }

  function renderModal(panel, rows, workbook) {
    const modal = document.querySelector(".luminaai-modal-backdrop");
    const kpis = rows.filter((row) => row.Section === "KPI").slice(0, 12);
    const tableSource = tableRows(panel);
    const tableHtml = tableSource.length
      ? tableSource
          .map((table) => {
            const headers = Object.keys(table.rows[0] || {});
            return `<section class="luminaai-modal-section"><h3>${table.title}</h3><div class="luminaai-modal-table-wrap"><table><thead><tr>${headers
              .map((header) => `<th>${header}</th>`)
              .join("")}</tr></thead><tbody>${table.rows
              .map((row) => `<tr>${headers.map((header) => `<td>${row[header] || ""}</td>`).join("")}</tr>`)
              .join("")}</tbody></table></div></section>`;
          })
          .join("")
      : '<div class="luminaai-empty">No tabular rows were present in this panel. KPI and chart data are still available in the downloads.</div>';

    modal.querySelector(".luminaai-modal-hd h2").textContent = panelTitle(panel);
    const exportRows = [...rows, ...workbookExportRows(workbook)];
    modal.querySelector(".luminaai-modal-hd p").textContent = `${activePillarName(panel)} - ${number(exportRows.length)} exported data points`;
    modal.querySelector(".luminaai-modal-body").innerHTML = `
      <section class="luminaai-modal-section">
        <h3>Panel KPIs</h3>
        <div class="luminaai-modal-grid">
          ${
            kpis.length
              ? kpis.map((row) => `<div class="luminaai-modal-card"><strong>${row.Value}</strong><span>${row.Item}</span><span>${row.Metric}</span></div>`).join("")
              : '<div class="luminaai-empty">No KPI cards found.</div>'
          }
        </div>
      </section>
      ${workbookTableHtml(workbook)}
      ${tableHtml}
    `;
    modal.dataset.filename = `${panel.id || "luminaai-panel"}-data`;
    modal._rows = exportRows;
    modal.classList.add("open");
  }

  function ensureModal() {
    if (document.querySelector(".luminaai-modal-backdrop")) {
      return;
    }
    const modal = document.createElement("div");
    modal.className = "luminaai-modal-backdrop";
    modal.innerHTML = `
      <div class="luminaai-modal" role="dialog" aria-modal="true" aria-label="Panel data details">
        <div class="luminaai-modal-hd">
          <div><h2>Panel Data</h2><p>Detailed data used by this panel</p></div>
          <div class="luminaai-modal-actions">
            <button type="button" data-download-csv>Download CSV</button>
            <button type="button" data-download-xlsx>Download XLSX</button>
            <button type="button" class="luminaai-close" data-close-modal>Close</button>
          </div>
        </div>
        <div class="luminaai-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target.matches(".luminaai-modal-backdrop,[data-close-modal]")) {
        modal.classList.remove("open");
      }
      if (event.target.matches("[data-download-csv]")) {
        downloadCsv(`${modal.dataset.filename}.csv`, modal._rows || []);
      }
      if (event.target.matches("[data-download-xlsx]")) {
        downloadXlsx(`${modal.dataset.filename}.xlsx`, modal._rows || []);
      }
    });
  }

  function ensureContextMenu() {
    if (document.querySelector(".luminaai-context-menu")) {
      return;
    }
    const menu = document.createElement("div");
    menu.className = "luminaai-context-menu";
    menu.innerHTML = `
      <div class="luminaai-context-head"></div>
      <button type="button" data-entity-details>View entity details</button>
      <button type="button" data-entity-navigate>Navigate to related KPI</button>
      <button type="button" data-entity-copy>Copy ID</button>
    `;
    document.body.appendChild(menu);
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".luminaai-context-menu")) {
        menu.classList.remove("open");
      }
    });
    menu.addEventListener("click", (event) => {
      const entityId = menu.dataset.entityId;
      if (!entityId) {
        return;
      }
      if (event.target.matches("[data-entity-details]")) {
        menu.classList.remove("open");
        openEntityDetails(entityId);
      }
      if (event.target.matches("[data-entity-navigate]")) {
        menu.classList.remove("open");
        navigateEntity(entityId);
      }
      if (event.target.matches("[data-entity-copy]")) {
        navigator.clipboard?.writeText(entityId);
        menu.classList.remove("open");
      }
    });
  }

  function showContextMenu(entityId, x, y) {
    ensureContextMenu();
    const menu = document.querySelector(".luminaai-context-menu");
    menu.dataset.entityId = entityId;
    menu.querySelector(".luminaai-context-head").textContent = entityId;
    menu.style.left = `${Math.min(x, window.innerWidth - 250)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - 170)}px`;
    menu.classList.add("open");
  }

  function openEntityDetails(entityId) {
    ensureModal();
    const modal = document.querySelector(".luminaai-modal-backdrop");
    modal.querySelector(".luminaai-modal-hd h2").textContent = `Entity: ${entityId}`;
    modal.querySelector(".luminaai-modal-hd p").textContent = "Loading cross-pillar details...";
    modal.querySelector(".luminaai-modal-body").innerHTML = '<div class="luminaai-empty">Loading entity records...</div>';
    modal.classList.add("open");

    fetch(`/api/entities/${encodeURIComponent(entityId)}`)
      .then((response) => response.json())
      .then((payload) => {
        const rows = payload.matches.flatMap((match) =>
          Object.entries(match.data).map(([metric, value]) => ({
            Section: match.sheetName,
            Item: `Row ${match.rowNumber}`,
            Metric: metric,
            Value: value ?? "",
          }))
        );
        modal._rows = rows;
        modal.dataset.filename = `${entityId}-entity-details`;
        modal.querySelector(".luminaai-modal-hd p").textContent = `${number(payload.matchCount)} matching records across workbook pillars`;
        modal.querySelector(".luminaai-modal-body").innerHTML = payload.matches.length
          ? payload.matches
              .map((match) => {
                const headers = Object.keys(match.data);
                return `<section class="luminaai-modal-section"><h3>${match.sheetName} - row ${match.rowNumber}</h3><div class="luminaai-modal-table-wrap"><table><tbody>${headers
                  .map((header) => `<tr><th>${header}</th><td>${match.data[header] ?? ""}</td></tr>`)
                  .join("")}</tbody></table></div></section>`;
              })
              .join("")
          : `<div class="luminaai-empty">No master workbook records found for ${entityId}.</div>`;
      });
  }

  function navigateEntity(entityId) {
    fetch(`/api/entities/${encodeURIComponent(entityId)}`)
      .then((response) => response.json())
      .then((payload) => {
        const target = payload.matches.find((match) => pillarForPanelCode(match.panelCode));
        const pillar = pillarForPanelCode(target?.panelCode);
        if (pillar && typeof window.showPillar === "function") {
          window.showPillar(pillar);
        } else {
          openEntityDetails(entityId);
        }
      });
  }

  function enhanceEntityText(root) {
    const targets = root.querySelectorAll("td, .badge, .kpi-card, .kpi, .info-row .val, .acct-card .field .fval");
    targets.forEach((node) => {
      if (node.dataset.entityEnhanced || node.querySelector(".luminaai-entity-link")) {
        return;
      }
      const entityId = extractEntityId(text(node));
      if (!entityId) {
        return;
      }
      node.dataset.entityEnhanced = "true";
      if (node.children.length === 0) {
        node.innerHTML = node.textContent.replace(entityPattern(), `<span class="luminaai-entity-link">$1</span>`);
      } else {
        node.classList.add("luminaai-entity-link");
      }
    });
  }

  function enhancePanels() {
    ensureModal();
    document.querySelectorAll(".panel-content").forEach((panel) => {
      if (panel.dataset.luminaaiEnhanced) {
        return;
      }
      panel.dataset.luminaaiEnhanced = "true";
      enhanceEntityText(panel);
      addKpiIcons(panel);
      const tools = document.createElement("div");
      tools.className = "luminaai-panel-tools";
      tools.innerHTML = '<button class="luminaai-detail-btn" type="button">View data / export</button>';
      panel.prepend(tools);
      tools.querySelector("button").addEventListener("click", (event) => {
        event.stopPropagation();
        const button = event.currentTarget;
        button.textContent = "Loading data...";
        button.disabled = true;
        fetchWorkbookRows(panel)
          .then((workbook) => {
            renderModal(panel, collectPanelRows(panel), workbook);
          })
          .finally(() => {
            button.textContent = "View data / export";
            button.disabled = false;
          });
      });
      fetchWorkbookRows(panel).then((workbook) => addRelatedEntities(panel, workbook));
    });
    const openMenu = (event) => {
      const target = event.target.closest(".luminaai-entity-link");
      if (!target) {
        return;
      }
      const entityId = target.dataset.entityId || extractEntityId(text(target));
      if (!entityId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      showContextMenu(entityId, event.clientX + 6, event.clientY + 6);
    };
    document.addEventListener("click", openMenu);
    document.addEventListener("contextmenu", openMenu);
  }

  fetch(cfg.summaryUrl)
    .then((response) => response.json())
    .then((summary) => {
      window.LUMINAAI_SUMMARY = summary;
      addStyles();
      enhancePanels();

      document.querySelectorAll(".header-sub, .status-bar, .hdr-meta").forEach((node) => {
        node.dataset.originalText = node.textContent;
      });
    })
    .catch(() => {
      // The screen remains usable even if the data API is temporarily unavailable.
    });
})();
