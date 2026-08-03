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
    pipelineId: firstNumber([
      payload.lead?.pipeline_id,
      payload.leads?.add?.[0]?.pipeline_id,
      payload.leads?.update?.[0]?.pipeline_id,
      payload.entity?.pipeline_id
    ]),
    statusId: firstNumber([
      payload.lead?.status_id,
      payload.leads?.add?.[0]?.status_id,
      payload.leads?.update?.[0]?.status_id,
      payload.entity?.status_id
    ]),
    oldPipelineId: firstNumber([
      payload.leads?.update?.[0]?.old_pipeline_id,
      payload.leads?.status?.[0]?.old_pipeline_id,
      payload.entity?.old_pipeline_id
    ]),
    oldStatusId: firstNumber([
      payload.leads?.update?.[0]?.old_status_id,
      payload.leads?.status?.[0]?.old_status_id,
      payload.entity?.old_status_id
    ]),
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
    channel: firstNonEmpty([
      payload.channel,
      payload.message?.channel?.name,
      payload.message?.channel?.type,
      payload.utm?.source,
      payload.source
    ]),
    campaign: firstNonEmpty([
      payload.campaign,
      payload.utm?.campaign,
      payload.message?.campaign
    ]),
    adset: firstNonEmpty([
      payload.adset,
      payload.utm?.adset,
      payload.message?.adset
    ]),
    ad: firstNonEmpty([
      payload.ad,
      payload.utm?.ad,
      payload.message?.ad
    ]),
    keyword: firstNonEmpty([
      payload.keyword,
      payload.utm?.term,
      payload.message?.keyword
    ]),
    unit: firstNonEmpty([
      payload.unit,
      payload.unidade,
      payload.message?.unit
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

function firstNumber(values) {
  const value = values.find((item) => item != null && item !== "");
  return value != null && value !== "" ? Number(value) : null;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").trim();
}
