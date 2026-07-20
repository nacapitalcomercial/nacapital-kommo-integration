import "dotenv/config";
import path from "node:path";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalNumber(name) {
  const value = process.env[name];
  return value ? Number(value) : null;
}

function optionalList(name) {
  const value = process.env[name];
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function optionalNumberList(name, fallback = "") {
  const value = process.env[name] || fallback;
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  app: {
    webhookDedupeTtlMs: Number(process.env.WEBHOOK_DEDUPE_TTL_MS || 300000),
    webhookMaxCacheEntries: Number(process.env.WEBHOOK_MAX_CACHE_ENTRIES || 2000),
    timezone: process.env.APP_TIMEZONE || "America/Sao_Paulo",
    dataStorePath: process.env.DATA_STORE_PATH || path.resolve("data", "automation-store.json"),
    metricsRecentLimit: Number(process.env.METRICS_RECENT_LIMIT || 100),
    followupPollMs: Number(process.env.FOLLOWUP_POLL_MS || 60000),
    inboundFollowupMinutes: optionalNumberList("INBOUND_FOLLOWUP_MINUTES", "15,120,1440,4320"),
    outboundFollowupMinutes: optionalNumberList("OUTBOUND_FOLLOWUP_MINUTES", "1440,4320")
  },
  kommo: {
    subdomain: required("KOMMO_SUBDOMAIN"),
    token: required("KOMMO_LONG_LIVED_TOKEN"),
    webhookSecret: process.env.KOMMO_WEBHOOK_SECRET || "",
    baseUrl: `https://${required("KOMMO_SUBDOMAIN")}.kommo.com/api/v4`,
    publicWebhookUrl: process.env.PUBLIC_WEBHOOK_URL || "",
    redirectUri: process.env.KOMMO_REDIRECT_URI || ""
  },
  pipelines: {
    default: optionalNumber("DEFAULT_PIPELINE_ID"),
    inboundTriage: optionalNumber("PIPELINE_FUNIL_VENDAS_ID") || optionalNumber("DEFAULT_PIPELINE_ID"),
    prospeccao: optionalNumber("PIPELINE_PROSPECCAO_ID"),
    escritorioVirtual: optionalNumber("PIPELINE_ESCRITORIO_VIRTUAL_ID"),
    avulsos: optionalNumber("PIPELINE_AVULSOS_ID"),
    eventos: optionalNumber("PIPELINE_EVENTOS_ID"),
    residencia: optionalNumber("PIPELINE_RESIDENCIA_ID"),
    coworking: optionalNumber("PIPELINE_COWORKING_ID"),
    joaoDaCruz: optionalNumber("PIPELINE_NC_JOAO_DA_CRUZ_ID"),
    rioBranco: optionalNumber("PIPELINE_NC_RIO_BRANCO_ID"),
    organizacao: optionalNumber("PIPELINE_ORGANIZACAO_ID")
  },
  users: {
    defaultResponsibleId: optionalNumber("DEFAULT_RESPONSIBLE_USER_ID"),
    sdrRoundRobinIds: optionalList("SDR_ROUND_ROBIN_USER_IDS"),
    closerRoundRobinIds: optionalList("CLOSER_ROUND_ROBIN_USER_IDS")
  },
  stages: {
    triagemNovoLead: optionalNumber("STAGE_TRIAGEM_NOVO_LEAD_ID"),
    triagemQualificacao: optionalNumber("STAGE_TRIAGEM_QUALIFICACAO_ID"),
    triagemAguardandoResposta: optionalNumber("STAGE_TRIAGEM_AGUARDANDO_RESPOSTA_ID"),
    triagemAgendamento: optionalNumber("STAGE_TRIAGEM_AGENDAMENTO_ID"),
    triagemEncaminhadoProduto: optionalNumber("STAGE_TRIAGEM_ENCAMINHADO_PRODUTO_ID"),
    prospeccaoBaseCarregada: optionalNumber("STAGE_PROSPECCAO_BASE_CARREGADA_ID"),
    prospeccaoPrimeiroContato: optionalNumber("STAGE_PROSPECCAO_PRIMEIRO_CONTATO_ID"),
    prospeccaoSemResposta: optionalNumber("STAGE_PROSPECCAO_SEM_RESPOSTA_ID"),
    prospeccaoContatoFeito: optionalNumber("STAGE_PROSPECCAO_CONTATO_FEITO_ID"),
    prospeccaoQualificado: optionalNumber("STAGE_PROSPECCAO_QUALIFICADO_ID"),
    prospeccaoReuniaoAgendada: optionalNumber("STAGE_PROSPECCAO_REUNIAO_AGENDADA_ID"),
    prospeccaoEntregueCloser: optionalNumber("STAGE_PROSPECCAO_ENTREGUE_CLOSER_ID"),
    prospeccaoSemFit: optionalNumber("STAGE_PROSPECCAO_SEM_FIT_ID"),
    prospeccaoReciclagem: optionalNumber("STAGE_PROSPECCAO_RECICLAGEM_ID"),
    evQualificacao: optionalNumber("STAGE_EV_QUALIFICACAO_ID"),
    evDocumentacao: optionalNumber("STAGE_EV_DOCUMENTACAO_ID"),
    evProntoContrato: optionalNumber("STAGE_EV_PRONTO_CONTRATO_ID"),
    evMorno: optionalNumber("STAGE_EV_MORNO_ID"),
    avulsosTriagem: optionalNumber("STAGE_AVULSOS_TRIAGEM_ID"),
    avulsosQualificacao: optionalNumber("STAGE_AVULSOS_QUALIFICACAO_ID"),
    avulsosProposta: optionalNumber("STAGE_AVULSOS_PROPOSTA_ID"),
    avulsosFechamento: optionalNumber("STAGE_AVULSOS_FECHAMENTO_ID"),
    eventosConfirmacao: optionalNumber("STAGE_EVENTOS_CONFIRMACAO_ID"),
    eventosParticipacao: optionalNumber("STAGE_EVENTOS_PARTICIPACAO_ID"),
    eventosFollowup: optionalNumber("STAGE_EVENTOS_FOLLOWUP_ID"),
    residenciaContatoInicial: optionalNumber("STAGE_RESIDENCIA_CONTATO_INICIAL_ID"),
    residenciaQualificacao: optionalNumber("STAGE_RESIDENCIA_QUALIFICACAO_ID"),
    residenciaVisita: optionalNumber("STAGE_RESIDENCIA_VISITA_ID"),
    residenciaProposta: optionalNumber("STAGE_RESIDENCIA_PROPOSTA_ID"),
    residenciaFollowup: optionalNumber("STAGE_RESIDENCIA_FOLLOWUP_ID"),
    residenciaContratacao: optionalNumber("STAGE_RESIDENCIA_CONTRATACAO_ID"),
    coworkingTriagem: optionalNumber("STAGE_COWORKING_TRIAGEM_ID"),
    coworkingSolucao: optionalNumber("STAGE_COWORKING_SOLUCAO_ID"),
    coworkingPendente: optionalNumber("STAGE_COWORKING_PENDENTE_ID"),
    coworkingProgresso: optionalNumber("STAGE_COWORKING_PROGRESSO_ID"),
    coworkingConcluido: optionalNumber("STAGE_COWORKING_CONCLUIDO_ID")
  },
  customFields: {
    produtoInteresse: optionalNumber("CUSTOM_FIELD_PRODUTO_INTERESSE_ID"),
    origemLead: optionalNumber("CUSTOM_FIELD_ORIGEM_LEAD_ID"),
    canal: optionalNumber("CUSTOM_FIELD_CANAL_ID"),
    campanha: optionalNumber("CUSTOM_FIELD_CAMPANHA_ID"),
    adset: optionalNumber("CUSTOM_FIELD_ADSET_ID"),
    anuncio: optionalNumber("CUSTOM_FIELD_ANUNCIO_ID"),
    palavraChave: optionalNumber("CUSTOM_FIELD_PALAVRA_CHAVE_ID"),
    temperaturaLead: optionalNumber("CUSTOM_FIELD_TEMPERATURA_LEAD_ID"),
    querContratar: optionalNumber("CUSTOM_FIELD_QUER_CONTRATAR_ID"),
    querFalarComTime: optionalNumber("CUSTOM_FIELD_QUER_FALAR_COM_TIME_ID"),
    prontoParaFechamento: optionalNumber("CUSTOM_FIELD_PRONTO_PARA_FECHAMENTO_ID"),
    documentacaoCompleta: optionalNumber("CUSTOM_FIELD_DOCUMENTACAO_COMPLETA_ID"),
    unidadeInteresse: optionalNumber("CUSTOM_FIELD_UNIDADE_INTERESSE_ID"),
    sdrResponsavel: optionalNumber("CUSTOM_FIELD_SDR_RESPONSAVEL_ID"),
    closerResponsavel: optionalNumber("CUSTOM_FIELD_CLOSER_RESPONSAVEL_ID"),
    dataPrimeiraResposta: optionalNumber("CUSTOM_FIELD_DATA_PRIMEIRA_RESPOSTA_ID"),
    dataAgendamento: optionalNumber("CUSTOM_FIELD_DATA_AGENDAMENTO_ID"),
    motivoPerda: optionalNumber("CUSTOM_FIELD_MOTIVO_PERDA_ID")
  },
  customFieldEnums: {
    produtoInteresse: {
      escritorio_virtual: { enumId: 929473, value: "Escritorio Virtual" },
      residencia: { enumId: 929475, value: "Residencia" },
      avulsos: { enumId: 929477, value: "Avulsos" },
      eventos: { enumId: 929479, value: "Eventos" },
      coworking: { enumId: 929481, value: "Coworking" }
    },
    origemLead: {
      google_ads: { enumId: 929483, value: "Google Ads" },
      instagram_ads: { enumId: 929485, value: "Instagram Ads" },
      whatsapp: { enumId: 929487, value: "WhatsApp" },
      site: { enumId: 929489, value: "Site" },
      sdr: { enumId: 929491, value: "SDR" },
      indicacao: { enumId: 929493, value: "IndicaÃ§Ã£o" },
      organico: { enumId: 929495, value: "OrgÃ¢nico" }
    },
    canal: {
      google: { enumId: 929497, value: "google" },
      instagram: { enumId: 929499, value: "instagram" },
      whatsapp: { enumId: 929501, value: "whatsapp" },
      site: { enumId: 929503, value: "site" },
      telefone: { enumId: 929505, value: "telefone" },
      sdr: { enumId: 929507, value: "sdr" },
      interno: { enumId: 929509, value: "interno" }
    },
    temperaturaLead: {
      frio: { enumId: 929511, value: "Frio" },
      morno: { enumId: 929513, value: "Morno" },
      quente: { enumId: 929515, value: "Quente" },
      muito_quente: { enumId: 929517, value: "Muito quente" }
    },
    querContratar: {
      sim: { enumId: 929519, value: "Sim" },
      nao: { enumId: 929521, value: "NÃ£o" }
    },
    querFalarComTime: {
      sim: { enumId: 929523, value: "Sim" },
      nao: { enumId: 929525, value: "NÃ£o" }
    },
    prontoParaFechamento: {
      sim: { enumId: 929527, value: "Sim" },
      nao: { enumId: 929529, value: "NÃ£o" }
    }
  },
  contactFields: {
    phone: optionalNumber("CONTACT_FIELD_PHONE_ID"),
    email: optionalNumber("CONTACT_FIELD_EMAIL_ID"),
    qualificacao: optionalNumber("CONTACT_FIELD_QUALIFICACAO_ID"),
    comoNosConheceu: optionalNumber("CONTACT_FIELD_COMO_NOS_CONHECEU_ID")
  },
  routing: {
    adsSources: (process.env.ADS_SOURCES || "google,google ads,instagram,instagram ads,meta,facebook")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
    outboundSources: (process.env.OUTBOUND_SOURCES || "sdr,outbound,prospeccao,prospecÃ§Ã£o,ativo")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  }
};
