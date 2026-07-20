import { config } from "./config.js";
import { detectIntent, detectProduct, normalizeText } from "./keywords.js";

const EV_DOC_MESSAGE =
  "Show! Para iniciarmos o contrato de Escritorio Virtual Mensal, preciso de cartao CNPJ se for pessoa juridica, documento de identidade ou CNH do representante, comprovante de residencia, contato do representante, e-mail para assinatura do contrato e e-mail para avisos financeiros.";

const ownerState = {
  sdr: 0,
  closer: 0
};

export async function processEvent(event, kommo) {
  const text = event.messageText || "";
  const product = detectProduct(text);
  const intent = detectIntent(text);
  const routing = classifyRouting(event);
  const leadContext = buildLeadContext({ event, intent, product, routing });

  const plan = {
    product: product?.product || null,
    intent,
    routingMode: routing.mode,
    routingChannel: routing.channel,
    specialistPipeline: leadContext.specialistPipelineName,
    actions: [],
    leadId: event.leadId || null,
    responsibleUserId: null,
    followups: []
  };

  if (!event.leadId && product) {
    const contact = await kommo.findOrCreateContact({
      name: event.contactName,
      phone: event.phone,
      email: event.email,
      source: event.source
    });

    const leadOwnerId = pickLeadOwner(routing);
    const specialistOwnerId = pickSpecialistOwner();
    const lead = await kommo.createLead({
      name: `${product.product} - ${event.contactName}`,
      pipelineId: leadContext.entryPipelineId,
      statusId: leadContext.entryStatusId,
      responsibleUserId: leadOwnerId,
      tags: buildLeadTags({ product, routing }),
      customFields: kommo.buildLeadFieldMap({
        produtoInteresse: product.product,
        origemLead: routing.originLabel,
        canal: routing.channel,
        campanha: event.campaign,
        adset: event.adset,
        anuncio: event.ad,
        palavraChave: event.keyword,
        temperaturaLead: leadContext.temperature,
        unidadeInteresse: event.unit,
        sdrResponsavel: routing.mode === "outbound_sdr" ? String(leadOwnerId || "") : "",
        closerResponsavel: specialistOwnerId ? String(specialistOwnerId) : ""
      })
    });

    plan.actions.push({
      type: "lead_created",
      leadId: lead?.id || null,
      pipeline: leadContext.entryPipelineName
    });
    plan.leadId = lead?.id || null;
    plan.responsibleUserId = leadOwnerId || null;

    if (lead?.id && contact?.id) {
      await kommo.attachContactToLead(lead.id, contact.id);
      plan.actions.push({
        type: "contact_linked",
        contactId: contact.id
      });
    }

    if (lead?.id) {
      await createEntryAutomation({
        event,
        kommo,
        leadId: lead.id,
        leadContext,
        routing,
        text,
        plan,
        responsibleUserId: leadOwnerId
      });
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

  plan.leadId = event.leadId;

  if (product?.product === "Escritorio Virtual") {
    await routeEscritorioVirtual(event, kommo, plan, leadContext, routing);
  }

  if (product?.product === "Avulsos") {
    await routeAvulsos(event, kommo, plan, leadContext, routing);
  }

  if (product?.product === "Eventos") {
    await routeEventos(event, kommo, plan, leadContext, routing);
  }

  if (product?.product === "Residencia") {
    await routeResidencia(event, kommo, plan, leadContext, routing);
  }

  if (product?.product === "Coworking") {
    await routeCoworking(event, kommo, plan, leadContext, routing);
  }

  if (intent === "quero_contratar") {
    await handleWantToBuy(event, kommo, product);
    plan.actions.push({ type: "document_flow_started" });
  }

  if (intent === "falar_com_time") {
    const closerId = pickSpecialistOwner();

    await kommo.updateLead(event.leadId, {
      responsible_user_id: closerId || config.users.defaultResponsibleId || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        querFalarComTime: "Sim",
        temperaturaLead: "Quente",
        closerResponsavel: closerId ? String(closerId) : ""
      })
    });

    await kommo.createTask({
      text: "Assumir atendimento humano solicitado pelo lead.",
      entityId: event.leadId,
      responsibleUserId: closerId || config.users.defaultResponsibleId,
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

async function createEntryAutomation({
  event,
  kommo,
  leadId,
  leadContext,
  routing,
  text,
  plan,
  responsibleUserId
}) {
  await kommo.addLeadNote(
    leadId,
    [
      `Lead criado automaticamente via integracao.`,
      `Origem: ${routing.originLabel}.`,
      `Canal: ${routing.channel}.`,
      `Fluxo: ${leadContext.entryPipelineName}.`,
      `Produto sugerido: ${leadContext.productName}.`,
      `Texto recebido: ${text || "sem texto"}.`
    ].join(" ")
  );

  if (routing.mode === "outbound_sdr") {
    await kommo.createTask({
      text: "Executar primeiro contato SDR e qualificar necessidade, produto e urgencia.",
      entityId: leadId,
      responsibleUserId: responsibleUserId || config.users.defaultResponsibleId,
      completeTill: unixHoursFromNow(2)
    });
    plan.followups.push(
      ...buildFollowupSchedule({
        leadId,
        responsibleUserId: responsibleUserId || config.users.defaultResponsibleId,
        routingMode: routing.mode,
        productName: leadContext.productName
      })
    );
    return;
  }

  await kommo.createTask({
    text: "Responder lead inbound dentro do SLA e validar produto, unidade e momento de compra.",
    entityId: leadId,
    responsibleUserId: responsibleUserId || config.users.defaultResponsibleId,
    completeTill: unixMinutesFromNow(5)
  });

  await kommo.createTask({
    text: "Se o lead nao responder, executar retomada comercial em 24h.",
    entityId: leadId,
    responsibleUserId: responsibleUserId || config.users.defaultResponsibleId,
    completeTill: unixHoursFromNow(24)
  });

  plan.followups.push(
    ...buildFollowupSchedule({
      leadId,
      responsibleUserId: responsibleUserId || config.users.defaultResponsibleId,
      routingMode: routing.mode,
      productName: leadContext.productName
    })
  );
}

async function routeEscritorioVirtual(event, kommo, plan, leadContext, routing) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.escritorioVirtual || undefined,
    status_id: config.stages.evQualificacao || undefined,
    custom_fields_values: buildCommonLeadFields({
      kommo,
      event,
      routing,
      productName: "Escritorio Virtual",
      temperature: "Morno"
    })
  });

  await kommo.addLeadNote(
    event.leadId,
    "Interesse em Escritorio Virtual detectado automaticamente. Recomenda-se enviar material e conduzir para qualificacao."
  );

  plan.actions.push({ type: "lead_routed", pipeline: "Escritorio Virtual" });
  void leadContext;
}

async function routeAvulsos(event, kommo, plan, leadContext, routing) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.avulsos || undefined,
    status_id: config.stages.avulsosTriagem || undefined,
    custom_fields_values: buildCommonLeadFields({
      kommo,
      event,
      routing,
      productName: "Avulsos",
      temperature: "Morno"
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
  void leadContext;
}

async function routeEventos(event, kommo, plan, leadContext, routing) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.eventos || undefined,
    status_id: config.stages.eventosConfirmacao || undefined,
    custom_fields_values: buildCommonLeadFields({
      kommo,
      event,
      routing,
      productName: "Eventos",
      temperature: "Morno"
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
  void leadContext;
}

async function routeResidencia(event, kommo, plan, leadContext, routing) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.residencia || undefined,
    status_id: config.stages.residenciaContatoInicial || undefined,
    custom_fields_values: buildCommonLeadFields({
      kommo,
      event,
      routing,
      productName: "Residencia",
      temperature: "Morno"
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
  void leadContext;
}

async function routeCoworking(event, kommo, plan, leadContext, routing) {
  await kommo.updateLead(event.leadId, {
    pipeline_id: config.pipelines.coworking || config.pipelines.joaoDaCruz || undefined,
    status_id: config.stages.coworkingTriagem || undefined,
    custom_fields_values: buildCommonLeadFields({
      kommo,
      event,
      routing,
      productName: "Coworking",
      temperature: "Morno"
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
  void leadContext;
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
      status_id: config.stages.avulsosFechamento || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        querContratar: "Sim",
        temperaturaLead: "Quente"
      })
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
      status_id: config.stages.residenciaContratacao || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        querContratar: "Sim",
        temperaturaLead: "Quente"
      })
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
      status_id: config.stages.coworkingProgresso || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        querContratar: "Sim",
        temperaturaLead: "Quente"
      })
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
  const closerId = pickSpecialistOwner();

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
    responsible_user_id: closerId || config.users.defaultResponsibleId || undefined,
    custom_fields_values: kommo.buildLeadFieldMap({
      prontoParaFechamento: "Sim",
      temperaturaLead: "Muito quente",
      closerResponsavel: closerId ? String(closerId) : ""
    })
  });

  await kommo.createTask({
    text: "Lead pronto para fechamento. Finalizar contrato com prioridade.",
    entityId: event.leadId,
    responsibleUserId: closerId || config.users.defaultResponsibleId,
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
      status_id: visitStatus,
      custom_fields_values: kommo.buildLeadFieldMap({
        dataAgendamento: nowDateTime()
      })
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

function buildLeadContext({ event, intent, product, routing }) {
  const productName = product?.product || "Nao identificado";
  const specialistPipelineName = resolveSpecialistPipelineName(product);

  return {
    productName,
    specialistPipelineName,
    entryPipelineName: routing.mode === "outbound_sdr" ? "PROSPECÇÃO" : "Funil de vendas",
    entryPipelineId:
      routing.mode === "outbound_sdr"
        ? config.pipelines.prospeccao || config.pipelines.default
        : config.pipelines.inboundTriage || config.pipelines.default,
    entryStatusId:
      routing.mode === "outbound_sdr"
        ? config.stages.prospeccaoPrimeiroContato || config.stages.prospeccaoBaseCarregada
        : config.stages.triagemNovoLead || config.stages.triagemQualificacao,
    temperature: resolveTemperature(intent, routing, event)
  };
}

function classifyRouting(event) {
  const source = normalizeText(event.source || "");
  const channel = normalizeText(event.channel || event.source || "kommo");
  const campaignText = normalizeText(
    [event.campaign, event.adset, event.ad, event.keyword].filter(Boolean).join(" ")
  );

  const isAds =
    config.routing.adsSources.some((term) => source.includes(term) || channel.includes(term)) ||
    /(utm|campanha|adset|anuncio|keyword|gclid|meta)/.test(campaignText);
  const isOutbound =
    config.routing.outboundSources.some((term) => source.includes(term) || channel.includes(term)) ||
    source.includes("ativo");

  return {
    mode: isOutbound ? "outbound_sdr" : isAds ? "inbound_ads" : "inbound",
    channel: event.channel || event.source || "kommo",
    originLabel: isOutbound ? "SDR Ativo" : isAds ? "Midia Paga" : "Inbound",
    normalizedSource: source
  };
}

function buildLeadTags({ product, routing }) {
  return [
    product?.product,
    "Origem automatica",
    routing.mode === "outbound_sdr" ? "SDR" : "Inbound",
    routing.mode === "inbound_ads" ? "Midia paga" : null
  ].filter(Boolean);
}

function buildCommonLeadFields({ kommo, event, routing, productName, temperature }) {
  return kommo.buildLeadFieldMap({
    produtoInteresse: productName,
    origemLead: routing.originLabel,
    canal: routing.channel,
    campanha: event.campaign,
    adset: event.adset,
    anuncio: event.ad,
    palavraChave: event.keyword,
    temperaturaLead: temperature,
    unidadeInteresse: event.unit
  });
}

function resolveTemperature(intent, routing, event) {
  if (intent === "pronto_para_fechamento") {
    return "Muito quente";
  }

  if (intent === "quero_contratar" || intent === "falar_com_time") {
    return "Quente";
  }

  if (intent === "agendar_visita" || routing.mode === "outbound_sdr") {
    return "Morno";
  }

  if (event.campaign || event.keyword) {
    return "Morno";
  }

  return "Frio";
}

function resolveSpecialistPipelineName(product) {
  switch (product?.product) {
    case "Escritorio Virtual":
      return "Escritorio Virtual";
    case "Avulsos":
      return "Avulsos";
    case "Eventos":
      return "Eventos";
    case "Residencia":
      return "Residencia";
    case "Coworking":
      return "NC - Joao da Cruz";
    default:
      return null;
  }
}

function pickLeadOwner(routing) {
  if (routing.mode === "outbound_sdr") {
    return nextRoundRobin("sdr", config.users.sdrRoundRobinIds) || config.users.defaultResponsibleId;
  }

  return config.users.defaultResponsibleId;
}

function pickSpecialistOwner() {
  return nextRoundRobin("closer", config.users.closerRoundRobinIds) || config.users.defaultResponsibleId;
}

function nextRoundRobin(type, pool) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return null;
  }

  const owner = pool[ownerState[type] % pool.length];
  ownerState[type] = (ownerState[type] + 1) % pool.length;
  return owner;
}

function unixHoursFromNow(hours) {
  return Math.floor((Date.now() + hours * 60 * 60 * 1000) / 1000);
}

function unixMinutesFromNow(minutes) {
  return Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
}

function nowDateTime() {
  return new Date().toLocaleString("sv-SE", { timeZone: config.app.timezone }).replace(" ", "T");
}

function buildFollowupSchedule({ leadId, responsibleUserId, routingMode, productName }) {
  const minutesList =
    routingMode === "outbound_sdr" ? config.app.outboundFollowupMinutes : config.app.inboundFollowupMinutes;

  return minutesList.map((minutes) => {
    const executeAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const hoursLabel = minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}min`;

    return {
      key: `${leadId}:${routingMode}:${minutes}`,
      leadId,
      responsibleUserId,
      label: `followup_${hoursLabel}`,
      executeAt,
      taskText: buildFollowupTaskText({ routingMode, productName, minutes }),
      noteText: `Follow-up automatico agendado para ${hoursLabel} no fluxo ${routingMode}.`
    };
  });
}

function buildFollowupTaskText({ routingMode, productName, minutes }) {
  const cadence = minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}min`;
  const scope = productName && productName !== "Nao identificado" ? `do produto ${productName}` : "do lead";

  if (routingMode === "outbound_sdr") {
    return `Executar retomada SDR em ${cadence} e requalificar interesse ${scope}.`;
  }

  return `Executar follow-up comercial em ${cadence} e tentar nova resposta ${scope}.`;
}
