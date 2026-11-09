import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { createNativeMessageRouter, extractNativeMessages } from "../src/native-message-webhook.js";

const secret = "test-only-native-secret-not-for-production";
const message = (overrides = {}) => ({
  id: "test-message-1", chat_id: "test-chat-1", talk_id: "123",
  contact_id: "456", entity_type: "lead", entity_id: "789",
  type: "incoming", author: { type: "external" }, message_type: "text",
  text: "Quero contratar escritorio virtual", origin: "whatsapp", ...overrides
});
const body = (records = [message()]) => ({ account: { id: "42" }, message: { add: records } });

async function withServer(t, options = {}) {
  const observations = [];
  const app = express();
  app.use("/native", createNativeMessageRouter({
    secret, accountId: 42, onObservation: (value) => observations.push(value), ...options
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/native`;
  return {
    observations,
    request: async (payload = body(), pathSecret = secret, options = {}) => {
      const response = await fetch(`${url}/${pathSecret}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(payload), ...options
      });
      return { status: response.status, data: await response.json() };
    }
  };
}

test("receives text without any CRM writes, message output or raw-text retention", async (t) => {
  const server = await withServer(t);
  const result = await server.request();
  assert.equal(result.status, 200);
  assert.equal(result.data.observed, 1);
  assert.equal(result.data.crmWrites, 0);
  assert.equal(result.data.outgoingMessages, 0);
  assert.equal(server.observations[0].productSuggestion, "Escritorio Virtual");
  assert.equal(server.observations[0].intentSuggestion, "quero_contratar");
  assert.equal(Object.hasOwn(server.observations[0], "messageText"), false);
  assert.equal(JSON.stringify(result).includes(message().text), false);
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("parses native URL-encoded bracket fields", async (t) => {
  const server = await withServer(t);
  const form = new URLSearchParams({
    "account[id]": "42", "message[add][0][id]": "form-1",
    "message[add][0][chat_id]": "chat-form", "message[add][0][talk_id]": "123",
    "message[add][0][entity_id]": "789", "message[add][0][entity_type]": "lead",
    "message[add][0][type]": "incoming", "message[add][0][author][type]": "external",
    "message[add][0][message_type]": "text", "message[add][0][text]": "sala de reuniao"
  });
  const result = await server.request(null, secret, {
    headers: { "content-type": "application/x-www-form-urlencoded" }, body: form.toString()
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.observed, 1);
  assert.equal(server.observations[0].productSuggestion, "Avulsos");
});

test("supports the documented root add payload", () => {
  const result = extractNativeMessages({ add: [message()] });
  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].leadId, 789);
});

test("is disabled without both a strong separate secret and an account ID", async (t) => {
  for (const options of [{ secret: "" }, { secret: "short" }, { accountId: null }]) {
    const server = await withServer(t, options);
    const result = await server.request();
    assert.equal(result.status, 404);
    assert.equal(server.observations.length, 0);
  }
});

test("rejects the wrong secret, wrong account and absent account", async (t) => {
  const server = await withServer(t);
  assert.equal((await server.request(body(), "wrong")).status, 401);
  assert.equal((await server.request({ ...body(), account: { id: "99" } })).status, 403);
  assert.equal((await server.request({ message: body().message })).status, 400);
  assert.equal(server.observations.length, 0);
});

test("ignores outgoing messages, bots, media, contacts and invalid IDs", async (t) => {
  const server = await withServer(t);
  const result = await server.request(body([
    message({ type: "outgoing" }), message({ author: { type: "bot" } }),
    message({ message_type: "voice" }), message({ entity_type: "contact" }),
    message({ entity_id: "invalid" }), message({ id: "" }), message({ text: "" })
  ]));
  assert.equal(result.status, 200);
  assert.equal(result.data.observed, 0);
  assert.equal(result.data.ignored, 7);
  assert.equal(server.observations.length, 0);
});

test("deduplicates provider message IDs, not identical message text", async (t) => {
  const server = await withServer(t);
  await server.request();
  const duplicate = await server.request();
  const otherMessage = await server.request(body([message({ id: "test-message-2" })]));
  assert.equal(duplicate.data.duplicates, 1);
  assert.equal(duplicate.data.observed, 0);
  assert.equal(otherMessage.data.observed, 1);
  assert.equal(server.observations.length, 2);
});

test("processes every incoming message in a batch", async (t) => {
  const server = await withServer(t);
  const result = await server.request(body([
    message({ id: "one" }), message({ id: "two" }), message({ id: "three" })
  ]));
  assert.equal(result.data.observed, 3);
  assert.equal(server.observations.length, 3);
});

test("deduplicates concurrent deliveries while the first observation is in flight", async (t) => {
  let observations = 0;
  const server = await withServer(t, { onObservation: async () => {
    observations += 1;
    await new Promise((resolve) => setTimeout(resolve, 30));
  } });
  const results = await Promise.all([server.request(), server.request(), server.request()]);
  assert.equal(observations, 1);
  assert.equal(results.reduce((sum, result) => sum + result.data.observed, 0), 1);
  assert.equal(results.reduce((sum, result) => sum + result.data.duplicates, 0), 2);
});

test("rejects large bodies and does not echo a secret URL on unsupported methods", async (t) => {
  const server = await withServer(t);
  assert.equal((await server.request(body([message({ text: "x".repeat(140000) })]))).status, 413);
  const result = await server.request(null, secret, { method: "GET", body: undefined });
  assert.equal(result.status, 405);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(server.observations.length, 0);
});

test("allows retry after an observation failure without leaking exception text", async (t) => {
  let failed = false;
  const server = await withServer(t, { onObservation: () => {
    if (!failed) { failed = true; throw new Error(secret); }
  } });
  const first = await server.request();
  const retry = await server.request();
  assert.equal(first.status, 503);
  assert.equal(JSON.stringify(first).includes(secret), false);
  assert.equal(retry.data.observed, 1);
});

test("rejects oversized batches and malformed JSON", async (t) => {
  const server = await withServer(t);
  assert.equal((await server.request(body(Array.from({ length: 101 }, () => message())))).status, 400);
  assert.equal((await server.request(null, secret, { body: "{" })).status, 400);
  assert.equal(server.observations.length, 0);
});

test("expired dedupe entries are processed again, with bounded cache size", async (t) => {
  let now = 1;
  const server = await withServer(t, { now: () => now, dedupeTtlMs: 10, maxDedupeEntries: 1 });
  await server.request();
  now = 12;
  assert.equal((await server.request()).data.observed, 1);
  await server.request(body([message({ id: "other" })]));
  assert.equal((await server.request()).data.observed, 1);
});
