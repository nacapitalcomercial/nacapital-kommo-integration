const institutionalMemory = [
      {
        title: "Camadas da base oficial",
        body: "A base oficial foi consolidada em company, branding, services, community, operations e marketing. Essa estrutura passou a ser a fonte principal de leitura institucional."
      },
      {
        title: "Leitura obrigatória",
        body: "Novos chats e novos agentes devem começar por AGENTS.md, START-HERE.md e MEMORIA-INSTITUCIONAL-CONSOLIDADA.md antes de consultar a pasta temática correspondente."
      },
      {
        title: "Inteligência portátil",
        body: "O arquivo NACAPITAL-CODEX-CHAT-INTELLIGENCE.md foi criado para transportar o contexto institucional para outras conversas do Codex com prompt, hierarquia e síntese."
      },
      {
        title: "Marketing consolidado",
        body: "A memória inclui ICP, personas e segmentação, com foco principal em profissionais liberais, pequenas empresas e prestadores de serviço."
      },
      {
        title: "Escritório Virtual",
        body: "Foram incorporadas regras sobre uso do endereço, documentos, limite de correspondências, restrições de estoque, e-commerce e cadastro/licenciamento."
      },
      {
        title: "Divergência mapeada",
        body: "Há divergência documental de prazo no Escritório Virtual: 7 dias em um trecho e 15 dias em outro. A orientação correta é confirmar o prazo vigente antes de responder de forma definitiva."
      },
      {
        title: "Site oficial incorporado",
        body: "A Central agora usa também o conteúdo institucional de nacapital.work e da página Quem Somos como base para posicionamento, pilares, serviços, unidades e linha do tempo."
      },
      {
        title: "Treinamento COp incorporado",
        body: "O documento de treinamento de Community Operations reforçou o papel da COp, suas frentes de atuação, agendas operacionais, planilhas centrais e a lógica de atendimento interno e externo."
      }
    ];

    const dictionary = [
      ["Coral", "Comunidade NaCapital: ecossistema vivo de pessoas diferentes que convivem, trocam, aprendem e prosperam juntas."],
      ["Residente", "Pessoa ou empresa com plano fixo em uma unidade, presente na rotina e nos rituais."],
      ["Turista", "Cliente avulso que usa espaço ou serviço pontual, sem plano fixo."],
      ["Parente", "Pessoa que frequenta o NaCapital por convite ou vínculo com residente/cliente."],
      ["Time de Primeiro Impacto", "Equipe de atendimento inicial, recepção, acolhimento e apoio à operação."],
      ["COp", "Community Operation: cuida do funcionamento, ambiência, estrutura e experiência."],
      ["CM", "Community Manager: fortalece o Coral, relacionamento, clima e cultura."],
      ["Mercado Honesto", "Área de conveniência baseada em confiança e autonomia da comunidade."],
      ["Rituais da Comunidade NaCapital", "Rituais são momentos criados para fortalecer a conexão, o aprendizado, o bem-estar e a energia da comunidade. São a alma do Coral."],
      ["Café Cultura (pausado)", "Um encontro leve mediado através de uma conversa e um convidado compartilhando experiências e ou conhecimento acerca de algum assunto cultural de interesse da comunidade. Objetivo: aproximação, inspiração e troca de conhecimentos entre os membros da comunidade."],
      ["NaCapital Vitórias", "Ação de impacto social da comunidade que acontece no fim do mês para celebrar a vitória do mês de cada um, seja ela pessoal ou profissional. Ótima para engajar pessoas e reforçar o propósito coletivo. Objetivo: usar nossa comunidade para inspirar e motivas, além de gerar conexões."],
      ["NaCapital Provoca", "Painel bimensal (alterna com o Drink About) com especialistas e convidados relevantes para discutir temas atuais voltados para o mercado, negócios, comportamento e inovação. Objetivo: provocar reflexões e expandir perspectivas."],
      ["Happy Hour NaCapital", "Momento descontraído de encontro e celebração que acontece na primeira quinta-feira do mês. Fortalece laços, cria networking e traz leveza ao coworking, dentro dele também acontece o anúncio do Residente do mês, eleito por votação entre a comunidade e o Boas-vindas dos residentes recém chegados. Objetivo: conectar pessoas além do trabalho."],
      ["Drink About", "Roda de conversa bimensal (alterna com o NaCapital Provoca) que mistura de diferentes áreas e temas com pessoas relevantes para o mercado de diferentes nichos em uma conversa descontraída e com intensa participação do público, comidas e bebidas. Objetivo: Misturar conversas sérias em um ambiente descontraído com intenso networking."]
    ];

    const checklists = {
      "Ao chegar": ["Ligar ar-condicionado e luzes", "Verificar WhatsApp da unidade", "Responder pendências urgentes", "Preparar salas reservadas", "Ativar som ambiente", "Checar copa e preparar café", "Conferir lounge", "Abastecer impressora"],
      "Preparação do dia": ["Checar Trello", "Verificar StationWe, WOBA e OFFI quando aplicável", "Conferir reservas no Conexa", "Ler relatório anterior de passagem de turno", "Priorizar demandas do dia", "Separar conteúdos/avisos solicitados"],
      "Durante o dia": ["Acompanhar WhatsApp com prontidão", "Zelar pela recepção e copa", "Registrar correspondências", "Comunicar entregas aos destinatários", "Alinhar demandas com COp", "Organizar salas antes e após reservas"],
      "Fechamento": ["Registrar pendências do turno", "Atualizar cartões no Trello quando necessário", "Conferir salas e copa", "Enviar relatório de passagem", "Sinalizar urgências para COp/CM"],
      "Compras": ["Guardar comprovante fiscal", "Cadastrar despesa no Conexa", "Anexar NF/boleto/recibo", "Enviar print no grupo de compras", "Salvar comprovante no SharePoint", "Conferir autorização para cartão da unidade"],
      "Impressora": ["Gerar contador para ELCMAR", "Fotografar ou digitalizar relatório", "Enviar conforme orientação", "Gerar contador interno NaCapital", "Cadastrar impressões no Conexa", "Arquivar documentos"],
      "Evento": ["Confirmar itens com COp", "Reservar/preparar espaço", "Organizar café, água e utensílios", "Apoiar lista/convites", "Registrar fotos e vídeos", "Limpar e reorganizar após o evento"],
      "Visita comercial": ["Não deixar recepção vazia", "Receber com cordialidade", "Qualificar finalidade, data, horário e pessoas", "Identificar produto ideal", "Enviar catálogo quando aplicável", "Registrar temperatura e repassar ao Comercial/COp"],
      "Escritório Virtual": ["Receber orientação do Comercial", "Confirmar contrato ativo e unidade", "Localizar kit da unidade no SharePoint", "Checar validade dos documentos", "Enviar kit em PDF", "Confirmar envio para Comercial e CM"],
      "TTLock visitante": ["Receber nome completo", "Receber documento com foto quando exigido", "Confirmar período de autorização", "Validar autorização formal", "Enviar eKey/senha temporária", "Registrar/revogar quando necessário"]
    };
