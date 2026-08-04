import express from "express";
import { config } from "./config.js";
import { KommoClient } from "./kommo-client.js";
import { error, log } from "./logger.js";
import { FollowupScheduler } from "./modules/followup/followup-scheduler.js";
import { EventStore } from "./modules/persistence/event-store.js";
import { MetricsService } from "./modules/reporting/metrics-service.js";
import { normalizeWebhook } from "./normalize-webhook.js";
import { launchIndicacaoBotFlow, processEvent } from "./rules.js";
import { WebhookGuard } from "./webhook-guard.js";

const app = express();
const kommo = new KommoClient();
const store = new EventStore(config.app.dataStorePath);
const metrics = new MetricsService({
  store,
  recentLimit: config.app.metricsRecentLimit
});
const followupScheduler = new FollowupScheduler({
  kommo,
  store,
  pollMs: config.app.followupPollMs,
  defaultResponsibleId: config.users.defaultResponsibleId
});
const webhookGuard = new WebhookGuard({
  ttlMs: config.app.webhookDedupeTtlMs,
  maxEntries: config.app.webhookMaxCacheEntries
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-kommo-secret");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return next();
});

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "nacapital-kommo-integration",
    webhookUrl: config.kommo.publicWebhookUrl || null,
    scheduler: {
      pollMs: config.app.followupPollMs
    }
  });
});

app.get("/health", async (_req, res) => {
  try {
    const account = await kommo.getAccount();
    res.json({
      ok: true,
      accountId: account?.id || null,
      subdomain: config.kommo.subdomain,
      webhookConfigured: Boolean(config.kommo.publicWebhookUrl),
      redirectConfigured: Boolean(config.kommo.redirectUri)
    });
  } catch (err) {
    error("Health check failed", err);
    res.status(500).json({ ok: false, error: "Kommo connection failed" });
  }
});

app.get("/metrics/summary", (_req, res) => {
  res.json({
    ok: true,
    summary: metrics.getSummary()
  });
});

app.get("/metrics/events", (_req, res) => {
  res.json({
    ok: true,
    events: metrics.getRecentEvents()
  });
});

app.get("/metrics/followups", (_req, res) => {
  res.json({
    ok: true,
    followups: metrics.getRecentFollowups()
  });
});

app.post("/webhooks/kommo", async (req, res) => {
  const requestId = webhookGuard.buildRequestId(req.headers);

  try {
    const secret = req.header("x-kommo-secret");
    if (config.kommo.webhookSecret && secret !== config.kommo.webhookSecret) {
      return res.status(401).json({ ok: false, error: "Invalid webhook secret", requestId });
    }

    const event = normalizeWebhook(req.body);
    const signature = webhookGuard.createSignature(event);
    const { duplicate } = webhookGuard.check(signature);

    if (duplicate) {
      log("Duplicate webhook ignored", {
        requestId,
        eventType: event.eventType,
        leadId: event.leadId,
        signature
      });

      return res.json({ ok: true, duplicate: true, requestId });
    }

    const result = await processEvent(event, kommo);
    followupScheduler.schedule(result);
    metrics.record({ event, result });

    log("Webhook processed", {
      requestId,
      eventType: event.eventType,
      leadId: event.leadId,
      contactId: event.contactId,
      product: result.product,
      intent: result.intent,
      actions: result.actions
    });

    return res.json({ ok: true, requestId, result });
  } catch (err) {
    error("Webhook processing failed", { requestId, err });
    return res.status(500).json({ ok: false, requestId, error: err.message });
  }
});

app.post("/simulate/message", async (req, res) => {
  const requestId = webhookGuard.buildRequestId(req.headers);

  try {
    const event = normalizeWebhook({
      ...req.body,
      event_type: "incoming_message"
    });
    const result = await processEvent(event, kommo);
    followupScheduler.schedule(result);
    metrics.record({ event, result });

    log("Simulation processed", {
      requestId,
      eventType: event.eventType,
      leadId: event.leadId,
      contactId: event.contactId,
      product: result.product,
      intent: result.intent
    });

    res.json({ ok: true, requestId, result });
  } catch (err) {
    error("Simulation failed", { requestId, err });
    res.status(500).json({ ok: false, requestId, error: err.message });
  }
});

app.post("/campaigns/indicacao/launch", async (req, res) => {
  const requestId = webhookGuard.buildRequestId(req.headers);

  try {
    const secret = req.header("x-kommo-secret");
    if (config.kommo.webhookSecret && secret !== config.kommo.webhookSecret) {
      return res.status(401).json({ ok: false, error: "Invalid webhook secret", requestId });
    }

    const leadIds = Array.isArray(req.body?.leadIds)
      ? req.body.leadIds.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)
      : [];
    const moveToStage = req.body?.moveToStage !== false;

    if (leadIds.length === 0) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "leadIds must be a non-empty array"
      });
    }

    if (moveToStage && (!config.pipelines.organizacao || !config.salesbots.indicacaoStageId)) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "Missing ORGANIZACAO pipeline or Campanha de indicacao stage configuration"
      });
    }

    const results = [];

    for (const leadId of leadIds) {
      if (moveToStage) {
        await kommo.updateLead(leadId, {
          pipeline_id: config.pipelines.organizacao,
          status_id: config.salesbots.indicacaoStageId
        });
      }

      await launchIndicacaoBotFlow({
        kommo,
        leadId,
        noteText:
          "Salesbot de campanha de indicacao disparado manualmente pela API da integracao."
      });

      results.push({
        leadId,
        movedToStage: moveToStage,
        botLaunched: true,
        deliveryMode: "salesbot_run_only",
        deliveryConfirmed: false,
        warning:
          "O Kommo aceitou o acionamento do bot, mas este endpoint nao confirma entrega real no WhatsApp. Para campanha de indicacao com numeros importados, o modo recomendado e Broadcasting com template aprovado."
      });
    }

    log("Indicacao campaign launched manually", {
      requestId,
      leadIds,
      moveToStage
    });

    return res.json({
      ok: true,
      requestId,
      campaign: "indicacao",
      results
    });
  } catch (err) {
    error("Indicacao campaign launch failed", { requestId, err });
    return res.status(500).json({ ok: false, requestId, error: err.message });
  }
});

app.post("/campaigns/indicacao/broadcast/prepare", async (req, res) => {
  const requestId = webhookGuard.buildRequestId(req.headers);

  try {
    const secret = req.header("x-kommo-secret");
    if (config.kommo.webhookSecret && secret !== config.kommo.webhookSecret) {
      return res.status(401).json({ ok: false, error: "Invalid webhook secret", requestId });
    }

    const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients : [];
    const moveToStage = req.body?.moveToStage !== false;
    const campaignName = req.body?.campaignName || "Campanha de indicacao";

    if (recipients.length === 0) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "recipients must be a non-empty array"
      });
    }

    if (!config.pipelines.organizacao || !config.salesbots.indicacaoStageId) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "Missing ORGANIZACAO pipeline or Campanha de indicacao stage configuration"
      });
    }

    const results = [];

    for (const recipient of recipients) {
      const prepared = await prepareIndicacaoBroadcastRecipient({
        kommo,
        recipient,
        campaignName,
        moveToStage
      });
      results.push(prepared);
    }

    log("Indicacao broadcast recipients prepared", {
      requestId,
      recipients: results.map((item) => ({
        leadId: item.leadId,
        contactId: item.contactId,
        phoneNormalized: item.phoneNormalized
      }))
    });

    return res.json({
      ok: true,
      requestId,
      campaign: "indicacao",
      mode: "broadcasting",
      results
    });
  } catch (err) {
    error("Indicacao broadcast prepare failed", { requestId, err });
    return res.status(500).json({ ok: false, requestId, error: err.message });
  }
});

app.listen(config.port, () => {
  followupScheduler.start();
  log(`NaCapital Kommo integration listening on port ${config.port}`);
});

async function prepareIndicacaoBroadcastRecipient({ kommo, recipient, campaignName, moveToStage }) {
  const name = String(recipient?.name || "").trim();
  const phoneOriginal = String(recipient?.phone || "").trim();
  const email = String(recipient?.email || "").trim();
  const indicatedBy = String(recipient?.indicatedBy || "").trim();
  const company = String(recipient?.company || "").trim();
  const existingLeadId = Number(recipient?.leadId || 0) || null;
  const phoneNormalized = kommo.normalizePhoneForStorage(phoneOriginal);

  if (!name) {
    throw new Error("Each recipient must include name");
  }

  if (!phoneNormalized) {
    throw new Error(`Recipient ${name} is missing a valid phone`);
  }

  const contact = await kommo.findOrCreateContact({
    name,
    phone: phoneNormalized,
    email,
    source: "Indicacao"
  });

  let leadId = existingLeadId;

  if (leadId) {
    await kommo.updateLead(leadId, {
      pipeline_id: config.pipelines.organizacao,
      status_id: moveToStage ? config.salesbots.indicacaoStageId : undefined,
      responsible_user_id: config.users.defaultResponsibleId || undefined,
      custom_fields_values: kommo.buildLeadFieldMap({
        origemLead: "Indicacao",
        canal: "whatsapp",
        campanha: campaignName
      })
    });
  } else {
    const lead = await kommo.createLead({
      name,
      pipelineId: config.pipelines.organizacao,
      statusId: moveToStage ? config.salesbots.indicacaoStageId : undefined,
      responsibleUserId: config.users.defaultResponsibleId,
      tags: ["campanha-indicacao", "broadcasting"],
      customFields: kommo.buildLeadFieldMap({
        origemLead: "Indicacao",
        canal: "whatsapp",
        campanha: campaignName
      })
    });
    leadId = lead?.id || null;
  }

  if (!leadId) {
    throw new Error(`Could not create or update lead for recipient ${name}`);
  }

  if (contact?.id) {
    await kommo.attachContactToLead(leadId, contact.id);
  }

  const noteParts = [
    "Lead preparado para envio via Kommo Broadcasting com template aprovado de WhatsApp.",
    `Telefone normalizado: ${phoneNormalized}.`,
    indicatedBy ? `Indicado por: ${indicatedBy}.` : null,
    company ? `Empresa: ${company}.` : null,
    "Importante: o envio inicial deve acontecer pelo modulo de Transmissao/Broadcasting, nao pelo disparo direto do Salesbot em lead sem conversa ativa."
  ].filter(Boolean);

  await kommo.addLeadNote(leadId, noteParts.join(" "));

  return {
    leadId,
    contactId: contact?.id || null,
    name,
    company: company || null,
    indicatedBy: indicatedBy || null,
    phoneOriginal,
    phoneNormalized,
    moveToStage,
    readyForBroadcast: true,
    deliveryMode: "kommo_broadcasting_template",
    nextStep:
      "Usar o modulo de Transmissao do Kommo com template aprovado para enviar a primeira mensagem a este destinatario."
  };
}
