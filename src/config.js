import "dotenv/config";

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

export const config = {
  port: Number(process.env.PORT || 3000),
  app: {
    webhookDedupeTtlMs: Number(process.env.WEBHOOK_DEDUPE_TTL_MS || 300000),
    webhookMaxCacheEntries: Number(process.env.WEBHOOK_MAX_CACHE_ENTRIES || 2000)
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
    escritorioVirtual: optionalNumber("PIPELINE_ESCRITORIO_VIRTUAL_ID"),
    avulsos: optionalNumber("PIPELINE_AVULSOS_ID"),
    eventos: optionalNumber("PIPELINE_EVENTOS_ID"),
    residencia: optionalNumber("PIPELINE_RESIDENCIA_ID"),
    coworking: optionalNumber("PIPELINE_COWORKING_ID")
  },
  users: {
    defaultResponsibleId: optionalNumber("DEFAULT_RESPONSIBLE_USER_ID")
  },
  stages: {
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
    temperaturaLead: optionalNumber("CUSTOM_FIELD_TEMPERATURA_LEAD_ID"),
    querContratar: optionalNumber("CUSTOM_FIELD_QUER_CONTRATAR_ID"),
    querFalarComTime: optionalNumber("CUSTOM_FIELD_QUER_FALAR_COM_TIME_ID"),
    prontoParaFechamento: optionalNumber("CUSTOM_FIELD_PRONTO_PARA_FECHAMENTO_ID"),
    documentacaoCompleta: optionalNumber("CUSTOM_FIELD_DOCUMENTACAO_COMPLETA_ID")
  },
  contactFields: {
    phone: optionalNumber("CONTACT_FIELD_PHONE_ID"),
    email: optionalNumber("CONTACT_FIELD_EMAIL_ID"),
    qualificacao: optionalNumber("CONTACT_FIELD_QUALIFICACAO_ID"),
    comoNosConheceu: optionalNumber("CONTACT_FIELD_COMO_NOS_CONHECEU_ID")
  }
};
