import { config } from "./config.js";
import { detectIntent, detectProduct } from "./keywords.js";

const EV_DOC_MESSAGE =
  "Show! Para iniciarmos o contrato de Escritorio Virtual Mensal, preciso de cartao CNPJ se for pessoa juridica, documento de identidade ou CNH do representante, comprovante de residencia, contato do representante, e-mail para assinatura do contrato e e-mail para avisos financeiros.";

export async function processEvent(event, kommo) {
  const text = event.messageText || "";
  const product = detectProduct(text);
  const intent = detectIntent(text);

  const plan = {
    product: product?.product || null,
    intent,
    actions: []
  };

  if (!event.leadId && product) {
    const contact = await kommo.findOrCreateContact({
      name: event.contactName,
      phone: event.phone,
      email: event.email,
      source: event.source
    });

    const lead = await kommo.createLead({
      name: `${product.product} - ${event.contactName}`,
      pipelineId: config.pipelines[product.pipelineKey] || config.pipelines.default,
      responsibleUserId: config.users.defaultResponsibleId,
      tags: [product.product, "Origem automatica"],
      customFields: kommo.buildLeadFieldMap({
        produtoInteresse: product.product,
        origemLead: event.source,
        temperaturaLead: "Novo"
      })
    });

    plan.actions.push({
      type: "lead_created",
      leadId: lead?.id || null
    });

    if (lead?.id && contact?.id) {
      await kommo.attachContactToLead(lead.id, contact.id);
      plan.actions.push({
        type: "contact_linked",
        contactId: contact.id
      });
    }

    if (lead?.id) {
      await kommo.addLeadNote(
        lead.id,
        `Lead criado automaticamente via integracao. Produto detectado: ${product.product}. Texto recebido: ${text || "sem texto"}`
      );
    }

    return plan;
  }

  if (!event.leadId) {
    return plan;
  }

  const attachedContact = await kommo.ensureLeadContact({
    leadId: event.leadId,
    existingContactId: event.contactId,
    name: event.contactName,
    phone: event.phone,
    email: event.email,
    source: event.source
  });

  if (attachedContact?.id) {
    plan.actions.push({
      type: "contact_ensured",
      contactId: attachedContact.id
    });
  }

  if (product?.product === "Escritorio Virtual") {
    await routeEscritorioVirtual(event, kommo, plan);
  }

  if (product?.product === "Avulsos") {
    await routeAvulsos(event, kommo, plan);
  }

  if (product?.product === "Eventos") {
    await routeEventos(event, kommo, plan);
  }

  if (product?.product === "Residencia") {
    await routeResidencia(event, kommo, plan);
  }

  if (product?.product === "Coworking") {
    await routeCoworking(event, kommo, plan);
  }

  if (intent === "quero_contratar") {
    await handleWantToBuy(event, kommo, product);
    plan.actions.push({ type: "document_flow_started" });
  }

  if (intent === "falar_com_time") {
    await kommo.updateLead(event.leadId, {
      responsible_user_id: config.users.defaultResponsibleId || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        querFalarComTime: "Sim",
        temperaturaLead: "Quente"
      })
    });

    await kommo.createTask({
      text: "Assumir atendimento humano solicitado pelo lead.",
      entityId: event.leadId,
      responsibleUserId: config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(1)
    });

    await kommo.addLeadNote(
      event.leadId,
      `Lead pediu atendimento humano. Resumo automatico: ${text || "sem conteudo capturado"}.`
    );

    plan.actions.push({ type: "human_handoff_requested" });
  }

  if (intent === "pronto_para_fechamento") {
    await handleClosingIntent(event, kommo, product, text);
    plan.actions.push({ type: "closing_flow_started" });
  }

  if (intent === "agendar_visita") {
    await handleVisitIntent(event, kommo, product);
    plan.actions.push({ type: "visit_requested" });
  }

  if (!product && intent === "duvida_comercial") {
    await kommo.createTask({
      text: "Responder duvida comercial e identificar qual produto da NaCapital interessa ao lead.",
      entityId: event.leadId,
      responsibleUserId: config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(2)
    });

    await kommo.addLeadNote(
      event.leadId,
      `Lead enviou duvida comercial sem produto claramente identificado. Texto: ${text || "sem conteudo capturado"}.`
    );

    plan.actions.push({ type: "commercial_question_flagged" });
  }

  return plan;
}

async function routeEscritorioVirtual(event, kommo, plan) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.escritorioVirtual || undefined,
    status_id: config.stages.evQualificacao || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      produtoInteresse: "Escritorio Virtual",
      origemLead: event.source
    })
  });

  await kommo.addLeadNote(
    event.leadId,
    "Interesse em Escritorio Virtual detectado automaticamente. Recomenda-se enviar material e conduzir para qualificacao."
  );

  plan.actions.push({ type: "lead_routed", pipeline: "Escritorio Virtual" });
}

async function routeAvulsos(event, kommo, plan) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.avulsos || undefined,
    status_id: config.stages.avulsosTriagem || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      produtoInteresse: "Avulsos",
      origemLead: event.source
    })
  });

  await kommo.createTask({
    text: "Qualificar demanda de avulso: data, periodo, quantidade de pessoas e tipo de uso.",
    entityId: event.leadId,
    responsibleUserId: config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(2)
  });

  await kommo.addLeadNote(
    event.leadId,
    "Lead roteado para Avulsos. Coletar data, periodo, quantidade de pessoas e objetivo da reserva."
  );

  plan.actions.push({ type: "lead_routed", pipeline: "Avulsos" });
}

async function routeEventos(event, kommo, plan) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.eventos || undefined,
    status_id: config.stages.eventosConfirmacao || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      produtoInteresse: "Eventos",
      origemLead: event.source
    })
  });

  await kommo.createTask({
    text: "Confirmar interesse em evento e coletar data, publico e estrutura necessaria.",
    entityId: event.leadId,
    responsibleUserId: config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(2)
  });

  await kommo.addLeadNote(
    event.leadId,
    "Lead roteado para Eventos. Validar data, quantidade de participantes e formato do evento."
  );

  plan.actions.push({ type: "lead_routed", pipeline: "Eventos" });
}

async function routeResidencia(event, kommo, plan) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.residencia || undefined,
    status_id: config.stages.residenciaContatoInicial || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      produtoInteresse: "Residencia",
      origemLead: event.source
    })
  });

  await kommo.createTask({
    text: "Iniciar qualificacao de Residencia e entender necessidade, urgencia e perfil do cliente.",
    entityId: event.leadId,
    responsibleUserId: config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(4)
  });

  await kommo.addLeadNote(
    event.leadId,
    "Lead roteado para Residencia. Validar perfil, necessidade, urgencia e interesse em visita."
  );

  plan.actions.push({ type: "lead_routed", pipeline: "Residencia" });
}

async function routeCoworking(event, kommo, plan) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.coworking || undefined,
    status_id: config.stages.coworkingTriagem || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      produtoInteresse: "Coworking",
      origemLead: event.source
    })
  });

  await kommo.createTask({
    text: "Triar lead de coworking/salas e identificar unidade, formato de uso e interesse em visita.",
    entityId: event.leadId,
    responsibleUserId: config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(2)
  });

  await kommo.addLeadNote(
    event.leadId,
    "Lead roteado para NC - Joao da Cruz como base de coworking/salas. Confirmar unidade e necessidade."
  );

  plan.actions.push({ type: "lead_routed", pipeline: "Coworking" });
}

async function handleWantToBuy(event, kommo, product) {
  if (product?.product === "Escritorio Virtual") {
    await kommo.updateLead(event.leadId, {
      status_id: config.stages.evDocumentacao || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        querContratar: "Sim",
        temperaturaLead: "Quente"
      })
    });

    await kommo.createTask({
      text: "Conferir documentacao de Escritorio Virtual e avancar contratacao.",
      entityId: event.leadId,
      responsibleUserId: config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(2)
    });

    await kommo.addLeadNote(event.leadId, EV_DOC_MESSAGE);
    return;
  }

  if (product?.product === "Avulsos") {
    await kommo.updateLead(event.leadId, {
      status_id: config.stages.avulsosFechamento || undefined
    });
    await kommo.createTask({
      text: "Finalizar reserva/contratacao do lead de Avulsos.",
      entityId: event.leadId,
      responsibleUserId: config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(1)
    });
    return;
  }

  if (product?.product === "Residencia") {
    await kommo.updateLead(event.leadId, {
      status_id: config.stages.residenciaContratacao || undefined
    });
    await kommo.createTask({
      text: "Avancar contratacao do lead de Residencia.",
      entityId: event.leadId,
      responsibleUserId: config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(1)
    });
    return;
  }

  if (product?.product === "Coworking") {
    await kommo.updateLead(event.leadId, {
      status_id: config.stages.coworkingProgresso || undefined
    });
    await kommo.createTask({
      text: "Avancar fechamento de coworking/sala com lead quente.",
      entityId: event.leadId,
      responsibleUserId: config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(1)
    });
  }
}

async function handleClosingIntent(event, kommo, product, text) {
  await kommo.updateLead(event.leadId, {
    status_id:
      product?.product === "Escritorio Virtual"
        ? config.stages.evProntoContrato || undefined
        : product?.product === "Avulsos"
          ? config.stages.avulsosFechamento || undefined
          : product?.product === "Residencia"
            ? config.stages.residenciaContratacao || undefined
            : product?.product === "Coworking"
              ? config.stages.coworkingProgresso || undefined
              : undefined,
    responsible_user_id: config.users.defaultResponsibleId || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      prontoParaFechamento: "Sim",
      temperaturaLead: "Muito quente"
    })
  });

  await kommo.createTask({
    text: "Lead pronto para fechamento. Finalizar contrato com prioridade.",
    entityId: event.leadId,
    responsibleUserId: config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(1)
  });

  await kommo.addLeadNote(
    event.leadId,
    `Lead sinalizou fechamento. Resumo automatico: ${text || "sem conteudo capturado"}.`
  );
}

async function handleVisitIntent(event, kommo, product) {
  const visitStatus =
    product?.product === "Residencia"
      ? config.stages.residenciaVisita
      : product?.product === "Coworking"
        ? config.stages.coworkingSolucao
        : null;

  if (visitStatus) {
    await kommo.updateLead(event.leadId, {
      status_id: visitStatus
    });
  }

  await kommo.createTask({
    text: "Organizar visita ao espaco e confirmar melhor data/horario com o lead.",
    entityId: event.leadId,
    responsibleUserId: config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(4)
  });

  await kommo.addLeadNote(
    event.leadId,
    "Lead demonstrou interesse em visita. Confirmar unidade, data e horario."
  );
}

function unixHoursFromNow(hours) {
  return Math.floor((Date.now() + hours * 60 * 60 * 1000) / 1000);
}
