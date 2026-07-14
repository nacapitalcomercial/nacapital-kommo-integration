import "dotenv/config";

const baseUrl = resolveBaseUrl();
const webhookSecret = required("VALIDATION_WEBHOOK_SECRET", process.env.KOMMO_WEBHOOK_SECRET);
const kommoSubdomain = required("KOMMO_SUBDOMAIN", process.env.KOMMO_SUBDOMAIN);
const kommoToken = required("KOMMO_LONG_LIVED_TOKEN", process.env.KOMMO_LONG_LIVED_TOKEN);
const expectedPipelineId = optionalNumber(
  "VALIDATION_EXPECTED_PIPELINE_ID",
  process.env.VALIDATION_EXPECTED_PIPELINE_ID || process.env.PIPELINE_ESCRITORIO_VIRTUAL_ID
);
const expectedStatusId = optionalNumber("VALIDATION_EXPECTED_STATUS_ID", process.env.VALIDATION_EXPECTED_STATUS_ID);
const expectedResponsibleId = optionalNumber(
  "VALIDATION_EXPECTED_RESPONSIBLE_ID",
  process.env.VALIDATION_EXPECTED_RESPONSIBLE_ID || process.env.DEFAULT_RESPONSIBLE_USER_ID
);
const validationProductText =
  process.env.VALIDATION_MESSAGE_TEXT || "quero contratar escritorio virtual";
const validationSource = process.env.VALIDATION_SOURCE || "whatsapp";
const webhookPath = process.env.VALIDATION_WEBHOOK_PATH || "/webhooks/kommo";
const healthPath = process.env.VALIDATION_HEALTH_PATH || "/health";
const rootPath = process.env.VALIDATION_ROOT_PATH || "/";

async function run() {
  const uniqueSuffix = Date.now();
  const payload = buildPayload(uniqueSuffix);

  const root = await fetchJson(joinUrl(baseUrl, rootPath));
  assertResponse(root, "root");

  const health = await fetchJson(joinUrl(baseUrl, healthPath));
  assertResponse(health, "health");

  const webhook = await fetchJson(joinUrl(baseUrl, webhookPath), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kommo-secret": webhookSecret
    },
    body: JSON.stringify(payload)
  });
  assertResponse(webhook, "webhook");

  const webhookBody = webhook.body || {};
  const result = webhookBody.result || {};
  const leadCreatedAction = Array.isArray(result.actions)
    ? result.actions.find((action) => action.type === "lead_created")
    : null;
  const contactLinkedAction = Array.isArray(result.actions)
    ? result.actions.find((action) => action.type === "contact_linked")
    : null;

  if (!leadCreatedAction?.leadId) {
    throw new Error("Webhook respondeu sem um lead criado para validacao.");
  }

  const lead = await fetchKommoLead(leadCreatedAction.leadId);
  const leadChecks = validateLead({ lead, payload, leadId: leadCreatedAction.leadId });

  const summary = {
    ok: true,
    baseUrl,
    requestId: webhookBody.requestId || null,
    validationLeadId: leadCreatedAction.leadId,
    validationContactId: contactLinkedAction?.contactId || null,
    root,
    health,
    webhook,
    lead: {
      id: lead.id,
      name: lead.name,
      pipelineId: lead.pipeline_id,
      statusId: lead.status_id,
      responsibleUserId: lead.responsible_user_id,
      tags: (lead._embedded?.tags || []).map((tag) => tag.name)
    },
    checks: leadChecks
  };

  console.log(JSON.stringify(summary, null, 2));
}

function buildPayload(uniqueSuffix) {
  const phone = `+55 11 9${String(uniqueSuffix).slice(-8)}`;
  const contactName = `Deploy Validation ${uniqueSuffix}`;
  const email = `deploy.validation.${uniqueSuffix}@example.com`;

  return {
    message: {
      text: validationProductText,
      phone,
      source: validationSource
    },
    contact: {
      name: contactName,
      email
    }
  };
}

async function fetchKommoLead(leadId) {
  const response = await fetch(`https://${kommoSubdomain}.kommo.com/api/v4/leads/${leadId}`, {
    headers: {
      Authorization: `Bearer ${kommoToken}`,
      "Content-Type": "application/json"
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Falha ao consultar lead ${leadId} no Kommo: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

function validateLead({ lead, payload, leadId }) {
  const checks = [];

  checks.push(assertCheck(lead?.id === leadId, "lead id confirmado no Kommo"));
  checks.push(assertCheck(lead?.name === `Escritorio Virtual - ${payload.contact.name}`, "nome do lead criado"));

  if (expectedPipelineId) {
    checks.push(
      assertCheck(
        Number(lead?.pipeline_id) === expectedPipelineId,
        `lead no pipeline esperado (${expectedPipelineId})`
      )
    );
  }

  if (expectedStatusId) {
    checks.push(
      assertCheck(Number(lead?.status_id) === expectedStatusId, `lead na etapa esperada (${expectedStatusId})`)
    );
  }

  if (expectedResponsibleId) {
    checks.push(
      assertCheck(
        Number(lead?.responsible_user_id) === expectedResponsibleId,
        `lead com responsavel esperado (${expectedResponsibleId})`
      )
    );
  }

  const tagNames = (lead?._embedded?.tags || []).map((tag) => tag.name);
  checks.push(assertCheck(tagNames.includes("Escritorio Virtual"), "tag de produto aplicada"));
  checks.push(assertCheck(tagNames.includes("Origem automatica"), "tag de origem automatica aplicada"));

  return checks;
}

function assertCheck(condition, label) {
  if (!condition) {
    throw new Error(`Validacao falhou: ${label}`);
  }

  return {
    ok: true,
    label
  };
}

function assertResponse(response, label) {
  if (!response.ok) {
    throw new Error(`Falha em ${label}: status ${response.status}`);
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    url,
    body
  };
}

function required(name, fallback) {
  if (!fallback) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return fallback;
}

function optionalNumber(_name, value) {
  return value ? Number(value) : null;
}

function resolveBaseUrl() {
  const directBaseUrl = process.env.VALIDATION_BASE_URL || process.env.SMOKE_BASE_URL;
  if (directBaseUrl) {
    return stripTrailingSlash(directBaseUrl);
  }

  if (process.env.PUBLIC_WEBHOOK_URL) {
    const url = new URL(process.env.PUBLIC_WEBHOOK_URL);
    return stripTrailingSlash(`${url.protocol}//${url.host}`);
  }

  return "http://127.0.0.1:3000";
}

function joinUrl(base, path) {
  return `${stripTrailingSlash(base)}${path.startsWith("/") ? path : `/${path}`}`;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

run().catch((err) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: err.message
      },
      null,
      2
    )
  );
  process.exit(1);
});
