import { createHash, randomUUID } from "node:crypto";

export class WebhookGuard {
  constructor({ ttlMs = 5 * 60 * 1000, maxEntries = 2000 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.seen = new Map();
  }

  buildRequestId(headers = {}) {
    return (
      headers["x-request-id"] ||
      headers["x-kommo-request-id"] ||
      headers["x-amocrm-requestid"] ||
      randomUUID()
    );
  }

  createSignature(event) {
    const raw = JSON.stringify({
      eventType: event.eventType,
      leadId: event.leadId,
      contactId: event.contactId,
      contactName: event.contactName,
      phone: event.phone,
      email: event.email,
      source: event.source,
      messageText: event.messageText
    });

    return createHash("sha1").update(raw).digest("hex");
  }

  check(signature) {
    const now = Date.now();
    this.prune(now);

    const existing = this.seen.get(signature);
    if (existing && now - existing < this.ttlMs) {
      return { duplicate: true };
    }

    this.seen.set(signature, now);
    return { duplicate: false };
  }

  prune(now = Date.now()) {
    for (const [signature, timestamp] of this.seen.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.seen.delete(signature);
      }
    }

    if (this.seen.size <= this.maxEntries) {
      return;
    }

    const oldest = [...this.seen.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, this.seen.size - this.maxEntries);

    for (const [signature] of oldest) {
      this.seen.delete(signature);
    }
  }
}
