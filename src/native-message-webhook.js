import { timingSafeEqual } from "node:crypto";
import express from "express";
import { detectIntent, detectProduct } from "./keywords.js";

const MAX_MESSAGES = 100;

export function extractNativeMessages(payload) {
  const records = payload?.message?.add ?? payload?.add ?? [];
  if (!Array.isArray(records) || records.length > MAX_MESSAGES) {
    throw new Error("Invalid message batch");
  }

  const messages = [];
  for (const item of records) {
    if (!item || typeof item !== "object") continue;
    const leadId = positiveInteger(item.entity_id ?? item.element_id);
    const isLead = item.entity_type === "lead" ||
      (!item.entity_type && String(item.element_type) === "2");
    if (!isLead || !leadId || item.type !== "incoming" ||
        item.author?.type !== "external" || item.message_type !== "text" ||
        typeof item.text !== "string" || !item.text.trim() || item.text.length > 10000 ||
        !validIdentifier(item.id) || !validIdentifier(item.chat_id)) continue;

    messages.push({
      messageId: item.id,
      chatId: item.chat_id,
      leadId,
      talkId: positiveInteger(item.talk_id),
      contactId: positiveInteger(item.contact_id),
      origin: typeof item.origin === "string" && /^[A-Za-z0-9_.-]{1,80}$/.test(item.origin)
        ? item.origin : null,
      messageText: item.text
    });
  }
  return { received: records.length, messages };
}

// This observer never calls the CRM client, scheduler, Salesbot or legacy rules.
export function createNativeMessageRouter({
  secret = "",
  accountId = null,
  onObservation = () => {},
  now = Date.now,
  dedupeTtlMs = 86400000,
  maxDedupeEntries = 5000
} = {}) {
  const router = express.Router();
  const expectedAccount = positiveInteger(accountId);
  const enabled = typeof secret === "string" && secret.length >= 32 && expectedAccount !== null;
  const seen = new Map();
  const inFlight = new Map();

  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!enabled) return res.status(404).json({ ok: false, error: "Observer disabled" });
    return next();
  });

  router.post("/:token", (req, res, next) => {
    const received = Buffer.from(req.params.token || "", "utf8");
    const expected = Buffer.from(secret, "utf8");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    return next();
  }, express.json({ limit: "128kb" }), express.urlencoded({
    extended: true, limit: "128kb", parameterLimit: 2000
  }), async (req, res) => {
    const receivedAccount = positiveInteger(req.body?.account?.id);
    if (receivedAccount === null) {
      return res.status(400).json({ ok: false, error: "Account ID required" });
    }
    if (receivedAccount !== expectedAccount) {
      return res.status(403).json({ ok: false, error: "Account mismatch" });
    }

    let batch;
    try {
      batch = extractNativeMessages(req.body);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid message batch" });
    }

    const timestamp = now();
    for (const [key, expiresAt] of seen) {
      if (expiresAt <= timestamp) seen.delete(key);
    }

    let observed = 0;
    let duplicates = 0;
    try {
      for (const message of batch.messages) {
        const key = JSON.stringify([expectedAccount, message.chatId, message.messageId]);
        if (seen.has(key)) {
          duplicates += 1;
          continue;
        }
        if (inFlight.has(key)) {
          await inFlight.get(key);
          duplicates += 1;
          continue;
        }
        // No raw message, phone, attachment URL or token is logged or retained.
        const metadata = {
          accountId: expectedAccount,
          messageId: message.messageId,
          leadId: message.leadId,
          talkId: message.talkId,
          origin: message.origin,
          productSuggestion: detectProduct(message.messageText)?.product || null,
          intentSuggestion: detectIntent(message.messageText)
        };
        const observation = Promise.resolve().then(() => onObservation(metadata)).then(() => {
          seen.set(key, now() + dedupeTtlMs);
          while (seen.size > maxDedupeEntries) seen.delete(seen.keys().next().value);
        });
        inFlight.set(key, observation);
        try {
          await observation;
        } finally {
          inFlight.delete(key);
        }
        observed += 1;
      }
    } catch {
      return res.status(503).json({ ok: false, error: "Observation failed; retry allowed" });
    }

    return res.json({
      ok: true,
      mode: "observe",
      received: batch.received,
      observed,
      duplicates,
      ignored: batch.received - batch.messages.length,
      crmWrites: 0,
      outgoingMessages: 0
    });
  });

  router.use((_req, res) => res.status(405).json({ ok: false, error: "POST required" }));
  router.use((err, _req, res, _next) => {
    return res.status(err.status === 413 ? 413 : 400)
      .json({ ok: false, error: "Invalid webhook body" });
  });
  return router;
}

function positiveInteger(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (!/^\d+$/.test(String(value))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function validIdentifier(value) {
  return typeof value === "string" && /^[A-Za-z0-9_.:-]{1,200}$/.test(value);
}
