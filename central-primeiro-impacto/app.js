const navButtons = [...document.querySelectorAll(".nav-btn, .nav-jump")];
    const sections = [...document.querySelectorAll(".section")];
    const sidebar = document.getElementById("sidebar");

    function showSection(id) {
      sections.forEach(s => s.classList.toggle("active", s.id === id));
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.section === id));
      sidebar.classList.remove("open");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navButtons.forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
    document.getElementById("menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));

    function tagClass(tag) {
      if (["comercial", "jurídico", "contrato", "d4sign"].some(x => tag.includes(x))) return "coral";
      if (["sharepoint", "conexa", "trello", "woba", "stationwe", "offi"].some(x => tag.includes(x))) return "blue";
      return "";
    }

    function renderArticle(item) {
      return `<article class="article">
        <div class="article-top">
          <div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
          </div>
          <span class="tag gray">${item.category}</span>
        </div>
        <ol class="steps">${item.steps.map(step => `<li>${step}</li>`).join("")}</ol>
        <div class="callout">${item.cautions}</div>
        <div class="tag-row">${item.tags.map(tag => `<span class="tag ${tagClass(tag)}">${tag}</span>`).join("")}</div>
      </article>`;
    }

    function renderPlaybooks(filter = "Todos") {
      const list = document.getElementById("playbookList");
      const filtered = filter === "Todos" ? knowledge : knowledge.filter(item => item.category === filter);
      list.innerHTML = filtered.map(renderArticle).join("");
    }

    function renderTools() {
      const tools = knowledge.filter(item => ["Ferramentas", "Acesso", "Segurança", "Marketplaces", "Financeiro", "Comercial", "Operacional"].includes(item.category));
      document.getElementById("toolList").innerHTML = tools.map(renderArticle).join("");
    }

    function renderCulture() {
      document.getElementById("cultureGrid").innerHTML = dictionary.map(([term, desc]) => `
        <div class="card">
          <h3>${term}</h3>
          <p>${desc}</p>
        </div>
      `).join("");
    }

    function renderCategories() {
      const categories = ["Todos", ...new Set(knowledge.map(item => item.category))];
      const holder = document.getElementById("categoryFilters");
      holder.innerHTML = categories.map((cat, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-filter="${cat}">${cat}</button>`).join("");
      holder.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
        holder.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderPlaybooks(btn.dataset.filter);
      }));
    }

    function normalize(text) {
      return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function scoreItem(item, query) {
      const q = normalize(query).split(/\s+/).filter(Boolean);
      const text = normalize([item.title, item.category, item.summary, item.cautions, item.tags.join(" "), item.steps.join(" ")].join(" "));
      return q.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    }

    function findMatches(query, limit = 5) {
      return knowledge
        .map(item => ({ item, score: scoreItem(item, query) }))
        .filter(row => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(row => row.item);
    }

    document.getElementById("globalSearch").addEventListener("input", event => {
      const query = event.target.value.trim();
      if (!query) {
        showSection("home");
        return;
      }
      const matches = findMatches(query, 12);
      document.getElementById("searchSummary").textContent = matches.length ? `${matches.length} resultado(s) para "${query}".` : `Nenhum resultado direto para "${query}".`;
      document.getElementById("resultsList").innerHTML = matches.length ? matches.map(renderArticle).join("") : `<div class="empty">Tente buscar por termos como WhatsApp, TTLock, compras, visita, Conexa, rotina ou SharePoint.</div>`;
      showSection("searchResults");
    });

    function answerQuestion(question) {
      const matches = findMatches(question, 3);
      if (!matches.length) {
        return "Não encontrei um procedimento direto para essa pergunta.\n\nPróximo passo: registre o contexto, consulte COp/CM e evite prometer exceções ao cliente antes de confirmar a informação oficial.";
      }
      const main = matches[0];
      const related = matches.slice(1).map(m => `- ${m.title}`).join("\n");
      return `${main.title}\n\n${main.summary}\n\nPasso a passo:\n${main.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nCuidado importante: ${main.cautions}\n\n${related ? `Procedimentos relacionados:\n${related}\n\n` : ""}Próximo passo recomendado: execute o procedimento padrão e escale para COp/CM, Comercial, Financeiro ou Jurídico se houver exceção, acesso sensível, desconto, contrato ou dado pessoal.`;
    }

    document.getElementById("askBtn").addEventListener("click", () => {
      const q = document.getElementById("askInput").value.trim();
      document.getElementById("assistantAnswer").textContent = q ? answerQuestion(q) : "Digite uma pergunta para consultar o manual.";
    });

    document.querySelectorAll(".example").forEach(btn => btn.addEventListener("click", () => {
      document.getElementById("askInput").value = btn.dataset.q;
      document.getElementById("assistantAnswer").textContent = answerQuestion(btn.dataset.q);
    }));

    function triage(text) {
      const q = normalize(text);
      const rules = [
        { keys: ["desconto", "contrato", "mensal", "escritorio virtual", "mais de 30", "20 horas"], label: "Encaminhar Comercial", why: "A demanda envolve negociação, contrato, desconto ou uso recorrente.", next: "Qualifique nome, empresa, finalidade, data, horários, quantidade de pessoas e temperatura do cliente antes de repassar." },
        { keys: ["boleto", "pagamento", "nota fiscal", "nf", "financeiro", "compra", "despesa"], label: "Encaminhar Financeiro/Jurídico ou registrar compra", why: "Há impacto financeiro, documento fiscal ou pagamento.", next: "Registre no Conexa quando for compra/despesa, salve comprovantes no SharePoint e envie print no grupo apropriado." },
        { keys: ["contrato", "assinatura", "d4sign", "juridico", "icp"], label: "Encaminhar Financeiro/Jurídico", why: "Documentos contratuais e assinatura exigem fluxo autorizado.", next: "Não altere documento assinado. Solicite orientação do setor responsável." },
        { keys: ["acesso", "ttlock", "senha", "ekey", "visitante", "documento"], label: "Consultar COp/CM", why: "Acesso físico depende de autorização e, em João da Cruz, pode envolver regra do prédio.", next: "Colete nome, documento, data e período; libere somente após autorização formal." },
        { keys: ["cartao", "trello", "pendencia", "tarefa", "prazo"], label: "Registrar no Trello", why: "A demanda precisa de responsável, prazo ou acompanhamento.", next: "Crie cartão com contexto, responsável, prazo, etiqueta e links do SharePoint." },
        { keys: ["sala", "reserva", "reuniao", "whatsapp", "correspondencia", "cafe", "copa", "impressora"], label: "Resolver agora", why: "Parece uma demanda operacional de rotina do 1º Impacto.", next: "Confirme informação no sistema, resolva com prontidão e registre/escale se houver exceção." }
      ];
      const hit = rules.find(rule => rule.keys.some(key => q.includes(key)));
      const result = hit || { label: "Consultar COp/CM", why: "A demanda não bate diretamente com uma rotina simples.", next: "Colete contexto, evite prometer solução e confirme o procedimento oficial." };
      return `${result.label}\n\nJustificativa: ${result.why}\n\nPróximos passos: ${result.next}`;
    }

    document.getElementById("triageBtn").addEventListener("click", () => {
      const text = document.getElementById("triageInput").value.trim();
      document.getElementById("triageAnswer").textContent = text ? triage(text) : "Descreva a demanda para classificar.";
    });

    function generateWhatsapp() {
      const type = document.getElementById("waType").value;
      const tone = document.getElementById("waTone").value;
      const details = document.getElementById("waDetails").value.trim() || "a sua solicitação";
      const closing = "Qualquer coisa, sigo por aqui para te ajudar.";
      const guard = type.includes("TTLock") ? "\n\nPara segurança, vou confirmar as informações de acesso antes de qualquer liberação." : "";
      const commercial = type.includes("Visita") ? "\n\nSe fizer sentido, também posso te enviar o catálogo com as opções mais adequadas para o que você precisa." : "";
      return `Olá, tudo bem? Aqui é [seu nome] do NaCapital.\n\nEntendi sobre ${details}. Vou te ajudar com essa demanda de ${type.toLowerCase()} de forma ${tone.toLowerCase()}.\n\nPara seguir com segurança, vou confirmar as informações necessárias e te retorno com o caminho completo. ${commercial}${guard}\n\n${closing}`;
    }

    document.getElementById("waBtn").addEventListener("click", () => {
      document.getElementById("waAnswer").textContent = generateWhatsapp();
    });

    document.getElementById("copyWa").addEventListener("click", async () => {
      const text = document.getElementById("waAnswer").textContent;
      await navigator.clipboard.writeText(text);
      document.getElementById("copyWa").textContent = "Copiado";
      setTimeout(() => document.getElementById("copyWa").textContent = "Copiar", 1400);
    });

    function loadChecks() {
      try { return JSON.parse(localStorage.getItem("nc-checklists") || "{}"); }
      catch { return {}; }
    }

    function saveChecks(state) {
      localStorage.setItem("nc-checklists", JSON.stringify(state));
    }

    function renderChecklists() {
      const state = loadChecks();
      const grid = document.getElementById("checklistGrid");
      grid.innerHTML = Object.entries(checklists).map(([name, items]) => {
        const done = state[name] || [];
        const percent = Math.round((done.length / items.length) * 100);
        return `<div class="card checklist-card" data-list="${name}">
          <div class="card-head">
            <div>
              <h3>${name}</h3>
              <p>${done.length}/${items.length} concluídos</p>
            </div>
            <span class="tag">${percent}%</span>
          </div>
          <div class="progress"><i style="width:${percent}%"></i></div>
          <div>
            ${items.map((item, index) => {
              const id = `${name}-${index}`;
              const checked = done.includes(index);
              return `<label class="check-item" for="${id}">
                <input id="${id}" type="checkbox" data-list="${name}" data-index="${index}" ${checked ? "checked" : ""}>
                <span class="${checked ? "done" : ""}">${item}</span>
              </label>`;
            }).join("")}
          </div>
        </div>`;
      }).join("");
      grid.querySelectorAll("input[type='checkbox']").forEach(input => input.addEventListener("change", () => {
        const state = loadChecks();
        const list = input.dataset.list;
        const index = Number(input.dataset.index);
        const values = new Set(state[list] || []);
        input.checked ? values.add(index) : values.delete(index);
        state[list] = [...values].sort((a,b) => a-b);
        saveChecks(state);
        renderChecklists();
      }));
    }

    document.getElementById("resetChecks").addEventListener("click", () => {
      localStorage.removeItem("nc-checklists");
      renderChecklists();
    });

    renderCategories();
    renderPlaybooks();
    renderTools();
    renderCulture();
    renderChecklists();
