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
    return fetch(`/api/datasets/panel/${code}?limit=1000`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
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

  function enhancePanels() {
    ensureModal();
    document.querySelectorAll(".panel-content").forEach((panel) => {
      if (panel.dataset.luminaaiEnhanced) {
        return;
      }
      panel.dataset.luminaaiEnhanced = "true";
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
    });
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
