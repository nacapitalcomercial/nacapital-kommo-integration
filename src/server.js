import express from "express";
import { config } from "./config.js";
import { KommoClient } from "./kommo-client.js";
import { error, log } from "./logger.js";
import { FollowupScheduler } from "./modules/followup/followup-scheduler.js";
import { EventStore } from "./modules/persistence/event-store.js";
import { MetricsService } from "./modules/reporting/metrics-service.js";
import { normalizeWebhook } from "./normalize-webhook.js";
import { processEvent } from "./rules.js";
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

app.listen(config.port, () => {
  followupScheduler.start();
  log(`NaCapital Kommo integration listening on port ${config.port}`);
});
