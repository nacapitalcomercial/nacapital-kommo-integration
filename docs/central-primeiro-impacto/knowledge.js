const knowledge = [
      {
        title: "Atendimento presencial",
        category: "Atendimento",
        summary: "Receber visitantes, residentes e fornecedores com cumprimento imediato, cordialidade, oferta de água/café, identificação rápida da demanda e acompanhamento até a solução.",
        steps: ["Cumprimente com sorriso e tom cordial.", "Identifique se é reunião, visita de residente, escritório virtual, tour ou fornecedor.", "Confira agenda, avise o residente e acompanhe a pessoa.", "Mantenha copa, recepção e salas organizadas.", "Aborde proativamente pessoas perdidas."],
        cautions: "Tom presencial: acolhedor, resolutivo, gentil e seguro.",
        tags: ["recepção", "visitante", "hospitalidade", "sala"]
      },
      {
        title: "Atendimento digital no WhatsApp",
        category: "Atendimento",
        summary: "Responder com rapidez, clareza e acompanhamento até o fim. A última mensagem deve ser da equipe.",
        steps: ["Apresente-se: 'Olá, tudo bem? Aqui é [nome] do NaCapital.'", "Repita a demanda para confirmar entendimento.", "Ofereça caminhos completos de solução.", "Confirme informações antes de encaminhar.", "Encaminhe para COp, CM ou Comercial quando sair do escopo.", "Finalize mantendo abertura para continuar ajudando."],
        cautions: "Evite garantir descontos, arranjos específicos ou decisões fora da rotina. Use linguagem humana e profissional, sem emojis excessivos.",
        tags: ["whatsapp", "tom de voz", "cliente", "resposta"]
      },
      {
        title: "Atendimento interno com residentes",
        category: "Atendimento",
        summary: "Apoio contínuo, empático e proativo para dúvidas sobre salas, impressora, eventos, fluxos e clima do coworking.",
        steps: ["Resolva pequenas demandas de forma imediata.", "Registre solicitações relevantes.", "Encaminhe à COp quando necessário.", "Observe a temperatura do ambiente: ar-condicionado e clima emocional.", "Proteja detalhes da operação e da vida dos residentes."],
        cautions: "Mantenha imparcialidade, discrição e postura profissional mesmo em um ambiente próximo.",
        tags: ["residente", "coral", "interno", "clima"]
      },
      {
        title: "SharePoint",
        category: "Ferramentas",
        summary: "Fonte oficial para armazenar, organizar e compartilhar documentos entre equipes, com coautoria, versões e acesso corporativo.",
        steps: ["Acesse a biblioteca da área.", "Crie ou envie arquivos com nomes claros.", "Compartilhe links internos em vez de anexos.", "Use busca e filtros para encontrar documentos.", "Recupere arquivos pela lixeira quando necessário."],
        cautions: "Não mover pastas inteiras sem alinhamento. Não excluir arquivos sem confirmação da liderança. Priorize permissões por grupo.",
        tags: ["sharepoint", "documentos", "arquivos", "lgpd"]
      },
      {
        title: "Kit para Escritório Virtual",
        category: "Escritório Virtual",
        summary: "Quando um novo cliente contrata Escritório Virtual, o time envia o kit da unidade contratada com documentos atualizados.",
        steps: ["Receba orientação do Comercial.", "Confirme contrato ativo e unidade contratada.", "Localize a pasta do kit no SharePoint.", "Verifique validade dos documentos.", "Envie o kit em PDF ao cliente.", "Confirme envio para Comercial e CM."],
        cautions: "Se alvará, IPTU ou documento estiver desatualizado ou perto de vencer, comunique a COp responsável.",
        tags: ["escritório virtual", "kit", "sharepoint", "cliente"]
      },
      {
        title: "Pasta Boletos",
        category: "Financeiro",
        summary: "Controle financeiro mensal das unidades com comprovantes, notas fiscais, boletos e prints de pagamento.",
        steps: ["Acesse a pasta Financeiro > Ano > Unidade > Mês.", "Inclua boletos, NFs e comprovantes.", "Nomeie com data de competência, categoria e fornecedor.", "Verifique legibilidade e completude.", "Atualize antes do fechamento financeiro."],
        cautions: "Organize logo após a compra ou pagamento. Não altere arquivos de outras pessoas sem alinhamento.",
        tags: ["boletos", "financeiro", "nota fiscal", "sharepoint"]
      },
      {
        title: "Trello",
        category: "Ferramentas",
        summary: "Gestão visual de tarefas com listas, cartões, etiquetas, responsáveis, prazos, checklists e templates.",
        steps: ["Crie cartão com título claro.", "Inclua contexto, links e anexos relevantes.", "Defina responsável e data de entrega.", "Aplique etiquetas por área/prioridade.", "Converta comentários acionáveis em checklist."],
        cautions: "Cada cartão precisa ter um responsável claro. Arquivos finais devem ficar no SharePoint; Trello guarda links.",
        tags: ["trello", "tarefas", "backlog", "prazo"]
      },
      {
        title: "D4Sign",
        category: "Ferramentas",
        summary: "Plataforma de assinatura eletrônica usada principalmente pelo Comercial/Jurídico, com trilha de auditoria.",
        steps: ["Prepare PDF final e valide dados.", "Inclua signatários e ordem de assinatura.", "Configure campos obrigatórios.", "Acompanhe status.", "Arquive documento final e relatório no SharePoint."],
        cautions: "O 1º Impacto não opera rotineiramente. Em dúvidas jurídicas ou ICP-Brasil, alinhe com Jurídico.",
        tags: ["d4sign", "contrato", "assinatura", "jurídico"]
      },
      {
        title: "TTLock",
        category: "Acesso",
        summary: "Sistema de fechadura inteligente com eKey, senha temporária, Bluetooth e níveis de acesso.",
        steps: ["Receba solicitação com nome, documento, data e período.", "Confirme autorização formal da empresa/residente.", "Escolha acesso permanente ou temporário conforme vínculo.", "Envie eKey ou senha somente após validação.", "Revogue acesso em caso de perda ou risco."],
        cautions: "Na unidade João da Cruz há controle compartilhado com o prédio. Não libere acesso sem documentação e autorização.",
        tags: ["ttlock", "acesso", "visitante", "segurança"]
      },
      {
        title: "LGPD e segurança",
        category: "Segurança",
        summary: "Armazenar dados pessoais somente quando necessário, com base legal, minimização e controle de acesso.",
        steps: ["Use SharePoint como fonte única.", "Evite dados sensíveis em locais sem controle.", "Revise permissões periodicamente.", "No offboarding, revogue acessos.", "Não compartilhe senhas ou eKeys."],
        cautions: "Qualquer tratamento de dado pessoal sensível deve ser escalado para liderança responsável.",
        tags: ["lgpd", "segurança", "dados", "acessos"]
      },
      {
        title: "Kommo",
        category: "Comercial",
        summary: "CRM usado pelo Comercial para acompanhar oportunidades, histórico, funil e distribuição de demandas.",
        steps: ["Entenda que o Kommo é origem de demandas comerciais.", "Receba apenas demandas validadas.", "Comunique dúvidas cadastrais à gestão comercial.", "Não opere alterações sem orientação."],
        cautions: "Uso exclusivo do Comercial. O 1º Impacto precisa compreender o fluxo, não operar o sistema.",
        tags: ["kommo", "crm", "comercial", "funil"]
      },
      {
        title: "Conexa",
        category: "Ferramentas",
        summary: "Plataforma principal de gestão do coworking: administrativo, financeiro e operacional.",
        steps: ["Cadastre clientes e pessoas com permissão adequada.", "Use financeiro para cobranças e contas a pagar.", "Registre vendas e reservas.", "Gerencie correspondências com foto e mensagem.", "Anexe comprovantes e mantenha registros no SharePoint."],
        cautions: "Dados de login e senha devem ficar apenas no arquivo autorizado. Cancelamentos de sala passam pela COp.",
        tags: ["conexa", "reserva", "financeiro", "correspondência"]
      },
      {
        title: "Correspondências",
        category: "Operacional",
        summary: "Registrar, fotografar, comunicar e entregar correspondências de forma rastreável.",
        steps: ["Acesse Correspondência > Nova Correspondência no Conexa.", "Preencha cliente, remetente e mensagem.", "Anexe foto.", "Comunique por WhatsApp com mensagem pronta.", "Na entrega, registre modo de entrega e confirme."],
        cautions: "Tempo de armazenamento indicado no manual: 3 meses. Mantenha registro claro.",
        tags: ["correspondência", "conexa", "whatsapp", "residente"]
      },
      {
        title: "WOBA, StationWe e OFFI",
        category: "Marketplaces",
        summary: "Plataformas usadas para verificar, aprovar e acompanhar reservas externas de salas e estações.",
        steps: ["Consulte reservas pendentes e futuras.", "Confira produto, data, horário e usuário.", "Filtre por unidade, período e status.", "Atualize informações de espaços quando autorizado.", "Trate OFFI como pendente se informações ainda não estiverem confirmadas."],
        cautions: "Credenciais devem ficar no arquivo de senhas autorizado, nunca no portal.",
        tags: ["woba", "stationwe", "offi", "reservas"]
      },
      {
        title: "Eventos e rituais",
        category: "Comunidade",
        summary: "Os rituais da comunidade fortalecem conexão, aprendizado, bem-estar e energia coletiva. São a alma do Coral e ajudam a transformar convivência em pertencimento.",
        steps: ["Café Cultura (pausado): encontro leve com conversa mediada e convidado compartilhando experiências ou conhecimento sobre temas culturais de interesse da comunidade, com foco em aproximação, inspiração e troca.", "NaCapital Vitórias: ação de impacto social no fim do mês para celebrar vitórias pessoais ou profissionais, engajando pessoas, reforçando propósito coletivo e gerando conexões.", "NaCapital Provoca: painel bimensal, alternado com o Drink About, com especialistas e convidados relevantes para discutir mercado, negócios, comportamento e inovação, provocando reflexão e expansão de perspectiva.", "Happy Hour NaCapital: encontro descontraído na primeira quinta-feira do mês para fortalecer laços, criar networking, anunciar o Residente do Mês e dar boas-vindas a quem acabou de chegar.", "Drink About: roda de conversa bimensal, alternada com o NaCapital Provoca, que mistura áreas, temas e pessoas relevantes em um ambiente descontraído, com intensa participação do público, comidas e bebidas.", "Na operação, prepare ambiente, copa, mobiliário, som, convites, recepção e registros conforme alinhamento com COp, CM e Marketing."],
        cautions: "Antes de divulgar ou executar qualquer ritual, confirme formato, responsáveis, insumos, convidados, comunicação e expectativa de experiência com COp, CM e Marketing.",
        tags: ["eventos", "rituais", "café cultura", "nacapital vitórias", "nacapital provoca", "happy hour", "drink about", "coral"]
      },
      {
        title: "Impressora e faturamento",
        category: "Financeiro",
        summary: "Processo mensal para gerar contadores, enviar dados à prestadora e cadastrar impressões no Conexa.",
        steps: ["No fim do mês, gere contador para ELCMAR.", "Fotografe ou digitalize o relatório.", "Envie conforme orientação.", "Gere contador para controle interno NaCapital.", "Cadastre impressões por cliente em Vendas no Conexa.", "Guarde documentos no SharePoint e pasta física."],
        cautions: "Cadastro no Conexa é obrigatório para repasse correto aos clientes.",
        tags: ["impressora", "faturamento", "conexa", "mês"]
      },
      {
        title: "Compras",
        category: "Financeiro",
        summary: "Toda compra precisa de comprovante, registro no Conexa, print no grupo de compras e arquivo salvo no SharePoint.",
        steps: ["Guarde NF, boleto, recibo ou print.", "Cadastre despesa em Financeiro > Contas a pagar.", "Preencha descrição, valor, datas, fornecedor, conta, categoria e linha digitável.", "Anexe documento fiscal.", "Envie print no grupo de compras.", "Salve comprovante no SharePoint."],
        cautions: "Compras às segundas; pagamentos às quartas após lançamento. Cartão da unidade só para emergências/autorização COp.",
        tags: ["compras", "despesa", "financeiro", "conexa"]
      },
      {
        title: "Rotina diária",
        category: "Rotina",
        summary: "A rotina garante funcionamento das unidades: chegada, preparação, acompanhamento do dia e passagem de turno.",
        steps: ["Ao chegar, ligue ar/luzes, veja WhatsApp, prepare salas, som, copa e impressora.", "Cheque Trello, plataformas de reserva, Conexa e relatório anterior.", "Durante o dia, acompanhe WhatsApp, salas, copa, correspondências e comunicação com COp.", "Registre pendências para o próximo turno."],
        cautions: "Autogerência e prontidão são parte da cultura: comece o dia consultando sistemas e priorizando demandas.",
        tags: ["rotina", "turno", "checklist", "operação"]
      },
      {
        title: "Limpeza e organização",
        category: "Operacional",
        summary: "Manter copa, recepção, salas e espaços comuns funcionais, leves e respeitosos para residentes e turistas.",
        steps: ["Abasteça cafeterias e insumos.", "Remova borras e lixo.", "Guarde louças secas.", "Organize cadeiras e salas.", "Reponha papel toalha e higiênico.", "Modere ruídos e boas práticas de convivência."],
        cautions: "Comunique lideranças quando houver violação recorrente das regras da comunidade.",
        tags: ["limpeza", "copa", "salas", "convivência"]
      },
      {
        title: "Visita e Comercial",
        category: "Comercial",
        summary: "Primeiro contato de visitantes ajuda a vender, qualificar demanda e passar informações claras ao Comercial/COp.",
        steps: ["Dê boas-vindas, pergunte nome e como conheceu a empresa.", "Ofereça água ou café.", "Qualifique finalidade, data, horário, pessoas e unidade.", "Indique produto mais adequado.", "Envie catálogo quando fizer sentido.", "Relate ao Comercial/COp a demanda, temperatura e interesse."],
        cautions: "O 1º Impacto pode fechar usos simples. Passe ao Comercial demandas com contrato, descontos, uso elevado ou escritório virtual.",
        tags: ["visita", "comercial", "venda", "catálogo"]
      },
      {
        title: "Base oficial da NaCapital",
        category: "Base Institucional",
        summary: "A base consolidada da NaCapital foi organizada em camadas temáticas que funcionam como fonte oficial de leitura para novos chats e agentes.",
        steps: ["Considere as pastas company, branding, services, community, operations e marketing como estrutura principal.", "Consulte a pasta temática correta antes de responder.", "Use a base como fonte oficial quando houver documentação consolidada.", "Se algo não estiver formalizado, sinalize a ausência em vez de inventar resposta."],
        cautions: "A base consolidada orienta a IA, mas não substitui a necessidade de confirmar informação quando houver divergência documental.",
        tags: ["base institucional", "company", "branding", "services", "operations", "marketing"]
      },
      {
        title: "Regras de entrada para novos chats",
        category: "Base Institucional",
        summary: "Novas conversas da NaCapital devem nascer com uma sequência de leitura obrigatória para preservar contexto e hierarquia de conflito.",
        steps: ["Ler AGENTS.md.", "Ler START-HERE.md.", "Ler MEMORIA-INSTITUCIONAL-CONSOLIDADA.md.", "Consultar a pasta temática correta.", "Responder somente com o que estiver documentado."],
        cautions: "Quando a base não formalizar algo, a IA deve explicitar a lacuna em vez de preencher com suposição forte.",
        tags: ["agents", "start-here", "memória", "novos chats", "hierarquia"]
      },
      {
        title: "Inteligência portátil da NaCapital",
        category: "Base Institucional",
        summary: "Existe um arquivo portátil para instalar a inteligência NaCapital em outras conversas do Codex.",
        steps: ["Usar o arquivo NACAPITAL-CODEX-CHAT-INTELLIGENCE.md como artefato de transferência.", "Aproveitar prompt de instalação, hierarquia de leitura e síntese institucional.", "Usar a mensagem curta para iniciar novos chats quando necessário."],
        cautions: "Esse arquivo acelera contexto, mas não substitui a consulta aos documentos oficiais quando o tema exigir precisão operacional.",
        tags: ["inteligência portátil", "codex", "contexto", "prompt de instalação"]
      },
      {
        title: "ICP e segmentação de marketing",
        category: "Marketing",
        summary: "A memória consolidou o ICP e personas principais da NaCapital com foco em profissionais liberais, pequenas empresas e prestadores de serviço.",
        steps: ["Trate esses públicos como referência principal de comunicação.", "Use mensagens segmentadas por público quando houver ação de marketing.", "Considere esse recorte ao pensar em propostas, anúncios e linguagem."],
        cautions: "Esse conhecimento é institucional e de marketing. Não substitui validação comercial para propostas específicas.",
        tags: ["icp", "personas", "meta ads", "profissionais liberais", "pequenas empresas"]
      },
      {
        title: "Escritório Virtual: regras e divergência de prazo",
        category: "Escritório Virtual",
        summary: "A memória consolidou regras do Escritório Virtual e registrou uma divergência documental sobre o prazo de negativa de órgão licenciador.",
        steps: ["Considere regras sobre uso do endereço, documentos fornecidos, limite de correspondências, restrições de estoque e orientações sobre e-commerce.", "Ao orientar cliente sobre negativa de órgão licenciador, verifique a versão vigente do prazo.", "Use a Central como referência inicial e confirme a política atual antes de resposta definitiva."],
        cautions: "Há divergência documentada entre 7 dias e 15 dias. O comportamento correto é confirmar o prazo vigente antes de orientar o cliente de forma definitiva.",
        tags: ["escritório virtual", "licenciamento", "prazo", "divergência documental", "7 dias", "15 dias"]
      },
      {
        title: "Posicionamento oficial do NaCapital",
        category: "Institucional",
        summary: "O site oficial posiciona o NaCapital como um novo jeito de trabalhar, com ambientes completos, inteligentes e prontos para uso, sem burocracia e sem preocupação com estrutura.",
        steps: ["Apresente o NaCapital como solução para facilitar a rotina de profissionais e empresas.", "Reforce que o cliente chega para trabalhar, sem precisar gerenciar estrutura, manutenção ou instalações.", "Use a linguagem institucional baseada em produtividade, praticidade, conexão e acolhimento.", "Quando falar da empresa, mantenha coerência com o tom oficial do site."],
        cautions: "Use o posicionamento institucional como base de comunicação, mas não invente números ou diferenciais que não estejam documentados na fonte oficial.",
        tags: ["site oficial", "quem somos", "novo jeito de trabalhar", "posicionamento", "institucional"]
      },
      {
        title: "Pilares oficiais da marca",
        category: "Institucional",
        summary: "Os pilares destacados no site oficial são flexibilidade, praticidade e acolhimento.",
        steps: ["Flexibilidade: os espaços se adaptam ao momento, porte da empresa e ritmo da rotina.", "Praticidade: ambientes completos e prontos para uso, sem burocracia.", "Acolhimento: ambiente profissional, humano e respeitoso, onde o trabalho flui leve e o pertencimento acontece.", "Use esses três pilares para calibrar linguagem, atendimento e apresentação dos serviços."],
        cautions: "Quando uma resposta estiver correta, mas soar fria ou burocrática demais, revise com base nesses pilares.",
        tags: ["pilares", "flexibilidade", "praticidade", "acolhimento", "marca"]
      },
      {
        title: "Portfólio oficial de serviços",
        category: "Serviços",
        summary: "O site oficial apresenta Escritório Virtual, Salas Privativas, Estações Individuais, Sala de Treinamento, Sala de Reunião e Hot Desk como soluções principais.",
        steps: ["Escritório Virtual: endereço fiscal e comercial com gestão de correspondências.", "Salas Privativas: ambientes exclusivos a partir de 2 posições, com acesso 24h, privacidade e estrutura completa.", "Estações Individuais: foco com praticidade em ambiente colaborativo.", "Sala de Treinamento: workshops, capacitações e eventos, até 20 pessoas ou 40 com business lounge.", "Sala de Reunião: encontros profissionais por hora, em diferentes tamanhos.", "Hot Desk: uso avulso por diária com chave digital e suporte da recepção em horário comercial."],
        cautions: "Descreva os serviços com base no material oficial. Para preços, condições especiais ou disponibilidade, confirme no fluxo comercial ou no sistema.",
        tags: ["serviços", "escritório virtual", "salas privativas", "hot desk", "sala de reunião", "treinamento"]
      },
      {
        title: "Unidades e presença física",
        category: "Institucional",
        summary: "O site oficial informa unidades em Vitória, na Praia do Canto, com operação nas localizações João da Cruz e Rio Branco.",
        steps: ["Use as unidades João da Cruz e Rio Branco como referência oficial de operação atual.", "Ao orientar visitantes, confirme endereço, acesso e unidade correta antes do envio.", "Mantenha coerência entre atendimento, agenda, reserva e comunicação da unidade."],
        cautions: "Se houver expansão, nova unidade ou mudança operacional, confirme o estágio atual antes de informar como algo já disponível.",
        tags: ["unidades", "praia do canto", "joão da cruz", "rio branco", "vitória"]
      },
      {
        title: "Marcos institucionais do NaCapital",
        category: "Institucional",
        summary: "A página Quem Somos registra marcos da trajetória da marca, incluindo consolidação da ideia em agosto de 2018, construção em agosto de 2019, expansão em 2022 e contrato da 3ª unidade em julho de 2025.",
        steps: ["Use a linha do tempo quando precisar contextualizar a maturidade da empresa.", "Agosto de 2018: consolidação da ideia do NaCapital.", "Agosto de 2019: projeto e construção da unidade João da Cruz.", "Outubro de 2022: expansão e inauguração da unidade Rio Branco.", "Julho de 2025: fechamento do contrato para projeto da 3ª unidade.", "Agosto de 2025: nova formatação do time de gestão e novas áreas internas."],
        cautions: "Esses marcos são históricos e devem ser citados com as datas registradas no site. Não trate como fatos novos em 2026 sem atualização confirmada.",
        tags: ["história", "linha do tempo", "2018", "2019", "2022", "2025", "expansão"]
      },
      {
        title: "Papel da Community Operations",
        category: "COp",
        summary: "O treinamento de Community Operations define a COp como ponto de equilíbrio entre estrutura, ambiência e experiência, responsável por garantir fluidez operacional, sustentar a comunidade, apoiar decisões e viabilizar crescimento com consistência.",
        steps: ["Entenda a COp como elo entre estrutura, experiência, comunidade e gestão.", "Reconheça que seu propósito é fazer com que tudo funcione bem e todos se sintam bem.", "Use essa lógica para encaminhar exceções, prioridades e decisões operacionais."],
        cautions: "A COp não é apenas apoio de bastidor. Ela atua como guardiã da estrutura, da ambiência e da experiência da unidade.",
        tags: ["cop", "community operations", "estrutura", "ambiência", "experiência"]
      },
      {
        title: "Frentes de atuação da COp",
        category: "COp",
        summary: "O treinamento organiza a atuação da COp em três frentes: Estrutura, Ambiência e Experiência.",
        steps: ["Estrutura: inventários, melhorias, orçamentos, reformas, áreas comuns, limpeza e preparação de ambientes.", "Ambiência: acompanhamento da equipe, prioridades, check-ins, aprendizado contínuo e reforço da identidade NaCapital.", "Experiência: suporte a residentes, atendimento, mobilização da comunidade, eventos, vínculo entre empresas e residentes e reforço do jeito prático, flexível e acolhedor."],
        cautions: "Quando a demanda misturar pessoas, espaço e processo, a resposta correta costuma passar por mais de uma frente da COp ao mesmo tempo.",
        tags: ["estrutura", "ambiência", "experiência", "equipe", "comunidade"]
      },
      {
        title: "Rotina de agendas da COp",
        category: "COp",
        summary: "O treinamento define agendas recorrentes da COp para alinhar o Time de Primeiro Impacto, comunidade, lideranças e operação entre unidades.",
        steps: ["Check-in operacional com o Time de Primeiro Impacto no início da semana.", "Check-out operacional no fim da semana.", "Agenda de gestão de comunidade para Coral, rituais e experiência dos residentes.", "Check-in semanal com lideranças para prioridades, riscos e indicadores.", "Reunião operacional entre CM e COp para padrões, aprendizados e demandas inter-unidades."],
        cautions: "Essas agendas existem para prevenção, continuidade e alinhamento. Se uma informação importante não entrou nesses ritos, o risco de ruído operacional sobe bastante.",
        tags: ["agendas", "check-in", "check-out", "lideranças", "cm", "rituais"]
      },
      {
        title: "Planilhas centrais da COp",
        category: "COp",
        summary: "O treinamento destaca três planilhas-chave para gestão: marketing e vendas, orçamento e estoque/lotação da unidade.",
        steps: ["Planilha de Marketing e Vendas: previsão mensal no primeiro dia útil, acompanhamento semanal às sextas via Conexa e executado no último dia útil do mês.", "Planilha Orçamentária: atualização contínua de custos por categoria, conferência com Conexa e respaldo documental no SharePoint.", "Planilha de Estoque e Lotação: monitorar posições ocupadas/disponíveis e apoiar decisões comerciais sem ultrapassar capacidade."],
        cautions: "Lançamento sem documento no SharePoint ou sem conferência com o Conexa enfraquece rastreabilidade e decisão.",
        tags: ["planilhas", "orçamento", "marketing e vendas", "estoque", "lotação", "conexa"]
      },
      {
        title: "Atendimento segundo o manual da COp",
        category: "Atendimento",
        summary: "O treinamento da COp reforça que atendimento no NaCapital é cuidar do funcionamento do espaço, da fluidez das relações e da experiência das pessoas.",
        steps: ["No atendimento interno, acolha, acompanhe demandas operacionais, oriente uso de espaços e sistemas, antecipe necessidades e documente ocorrências.", "No atendimento externo, recepcione visitantes, oriente acessos e circulação, atenda canais digitais com clareza, alinhe horários e encaminhe leads conforme fluxo.", "Aplique sempre empatia, clareza, agilidade, responsabilidade e coerência com a marca."],
        cautions: "O treinamento reforça que a COp acompanha a demanda até o fim. Atender não é apenas responder: é garantir resolução com organização e presença.",
        tags: ["atendimento", "cop", "empatia", "clareza", "agilidade", "responsabilidade"]
      }
    ];
