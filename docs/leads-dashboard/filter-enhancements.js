(function () {
  const ROOT_CLASS = "filter-ui-v2";
  const STYLESHEET_HREF = "./filter-enhancements.css";

  function byId(id) {
    return document.getElementById(id);
  }

  function ensureStylesheet() {
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .find((node) => (node.getAttribute("href") || "").includes("filter-enhancements.css"));

    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLESHEET_HREF;
    document.head.appendChild(link);
  }

  function addRootClass() {
    document.body.classList.add(ROOT_CLASS);
  }

  function enhancePanel(panelId, triggerId, selectedId, selectAllId, selectLatestId, panelTitle, panelHint) {
    const panel = byId(panelId);
    const trigger = byId(triggerId);
    const selected = byId(selectedId);
    const selectAll = byId(selectAllId);
    const selectLatest = byId(selectLatestId);

    if (!panel || !trigger || panel.dataset.enhanced === "true") {
      return;
    }

    panel.dataset.enhanced = "true";

    const header = document.createElement("div");
    header.className = "period-filter-panel-header";
    header.innerHTML = `
      <div class="period-filter-panel-title">
        <strong>${panelTitle}</strong>
        <span>${panelHint}</span>
      </div>
      <button class="period-filter-close" type="button">Fechar</button>
    `;

    panel.prepend(header);

    header.querySelector(".period-filter-close")?.addEventListener("click", () => {
      trigger.click();
    });

    [selectAll, selectLatest].forEach((button) => {
      button?.addEventListener("click", () => {
        requestAnimationFrame(() => {
          trigger.click();
        });
      });
    });

    if (selected) {
      const chipObserver = new MutationObserver(() => {
        decorateChips(selected, panel);
      });
      chipObserver.observe(selected, { childList: true, subtree: true });
      decorateChips(selected, panel);
    }

    const optionObserver = new MutationObserver(() => {
      decorateOptions(panel);
    });
    const list = panel.querySelector(".period-filter-list");
    if (list) {
      optionObserver.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      decorateOptions(panel);
    }
  }

  function decorateOptions(panel) {
    panel.querySelectorAll(".period-filter-option").forEach((option) => {
      const checkbox = option.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      option.classList.toggle("is-selected", checkbox.checked);
    });
  }

  function decorateChips(container, panel) {
    const chips = Array.from(container.querySelectorAll(".period-filter-chip"));
    chips.forEach((chip) => {
      const text = chip.textContent ? chip.textContent.trim() : "";
      chip.classList.toggle("is-summary", /todos os períodos|\+/i.test(text));

      if (chip.classList.contains("is-muted") || chip.dataset.actionBound === "true") {
        return;
      }

      const option = Array.from(panel.querySelectorAll(".period-filter-option"))
        .find((item) => item.textContent && item.textContent.includes(text));

      if (!option) return;
      const checkbox = option.querySelector('input[type="checkbox"]');
      if (!checkbox) return;

      chip.dataset.actionBound = "true";
      chip.classList.add("period-filter-chip-action");
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("title", `Remover ${text}`);
      chip.setAttribute("aria-label", `Remover ${text}`);

      const toggleChip = () => {
        if (!checkbox.checked) return;
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      };

      chip.addEventListener("click", toggleChip);
      chip.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleChip();
        }
      });
    });
  }

  function addSelectionMeta() {
    const pairs = [
      {
        badge: byId("totals-period-badge"),
        label: byId("totals-period-trigger-label"),
        selected: byId("totals-period-selected")
      },
      {
        badge: byId("funnel-period-badge"),
        label: byId("funnel-period-trigger-label"),
        selected: byId("funnel-period-selected")
      }
    ];

    pairs.forEach(({ badge, label, selected }) => {
      const sync = () => {
        if (!badge || !label) return;
        const count = Number.parseInt((badge.textContent || "0").trim(), 10) || 0;
        const chipCount = selected ? selected.querySelectorAll('.period-filter-chip').length : 0;
        if (count <= 1 && chipCount <= 1) {
          badge.style.opacity = "0.78";
        } else {
          badge.style.opacity = "1";
        }
        label.title = label.textContent || "";
      };

      const observer = new MutationObserver(sync);
      if (badge) {
        observer.observe(badge, { childList: true, subtree: true, characterData: true });
      }
      if (label) {
        observer.observe(label, { childList: true, subtree: true, characterData: true });
      }
      if (selected) {
        observer.observe(selected, { childList: true, subtree: true, characterData: true });
      }
      sync();
    });
  }

  function explainRootCause() {
    const status = byId("status-line");
    if (!status || status.dataset.enhancedStatus === "true") {
      return;
    }
    status.dataset.enhancedStatus = "true";
    status.textContent = "Use planilhas XLSX ou CSV exportadas do Excel. O painel mantém filtros e fonte conectada no navegador, por isso mudanças de versão podem refletir junto com o estado salvo da última navegação.";
  }

  function boot() {
    ensureStylesheet();
    addRootClass();
    enhancePanel(
      "totals-period-panel",
      "totals-period-trigger",
      "totals-period-selected",
      "totals-select-all",
      "totals-select-latest",
      "Períodos visíveis",
      "Combine uma ou várias semanas ou meses para uma leitura mais enxuta ou mais completa."
    );
    enhancePanel(
      "funnel-period-panel",
      "funnel-period-trigger",
      "funnel-period-selected",
      "funnel-select-all",
      "funnel-select-latest",
      "Períodos da conversão",
      "Escolha um ou vários recortes para comparar o avanço comercial com mais fluidez."
    );
    addSelectionMeta();
    explainRootCause();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
