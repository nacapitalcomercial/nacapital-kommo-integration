export function normalizeWebhook(body) {
  const payload = body || {};

  const messageText = firstNonEmpty([
    payload.message?.text,
    payload.talk?.message?.text,
    payload.chat_message?.text,
    payload.last_message?.text,
    payload.message?.message?.text,
    payload.text
  ]);

  const leadId = firstNonEmpty([
    payload.lead?.id,
    payload.leads?.add?.[0]?.id,
    payload.leads?.update?.[0]?.id,
    payload.entity?.id,
    payload.chat?.entity_id
  ]);

  const contactId = firstNonEmpty([
    payload.contact?.id,
    payload.contacts?.add?.[0]?.id,
    payload.contacts?.update?.[0]?.id,
    payload.message?.contact?.id
  ]);

  const contactName = firstNonEmpty([
    payload.contact?.name,
    payload.contacts?.add?.[0]?.name,
    payload.contacts?.update?.[0]?.name,
    payload.message?.contact?.name,
    payload.chat?.name,
    "Lead sem nome"
  ]);

  const phone = normalizePhone(
    firstNonEmpty([
      payload.contact?.phone,
      payload.contact?.custom_fields_values?.[0]?.values?.[0]?.value,
      payload.message?.phone,
      payload.message?.contact?.phone,
      payload.chat?.phone,
      payload.phone
    ])
  );

  const email = firstNonEmpty([
    payload.contact?.email,
    payload.message?.contact?.email,
    payload.email
  ]);

  return {
    raw: payload,
    leadId: leadId ? Number(leadId) : null,
    contactId: contactId ? Number(contactId) : null,
    messageText,
    phone,
    email,
    contactName,
    source: firstNonEmpty([
      payload.source,
      payload.message?.source,
      payload.chat?.source,
      payload.message?.channel?.type,
      "kommo"
    ]),
    eventType: payload.event_type || payload.type || detectEventType(payload)
  };
}

function detectEventType(payload) {
  if (payload.message || payload.chat_message || payload.talk) {
    return "incoming_message";
  }

  if (payload.leads?.add) {
    return "lead_added";
  }

  if (payload.leads?.update) {
    return "lead_updated";
  }

  return "unknown";
}

function firstNonEmpty(values) {
  return values.find((value) => value != null && value !== "") || "";
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").trim();
}
