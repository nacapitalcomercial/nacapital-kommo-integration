const baseUrl = process.env.INDICACAO_BASE_URL || "http://127.0.0.1:3000";
const secret = process.env.INDICACAO_WEBHOOK_SECRET || process.env.KOMMO_WEBHOOK_SECRET || "";
const moveToStage = String(process.env.INDICACAO_MOVE_TO_STAGE || "true").toLowerCase() !== "false";
const leadIds = parseLeadIds(process.env.INDICACAO_LEAD_IDS || "");

if (!secret) {
  throw new Error("Defina INDICACAO_WEBHOOK_SECRET ou KOMMO_WEBHOOK_SECRET.");
}

if (leadIds.length === 0) {
  throw new Error("Defina INDICACAO_LEAD_IDS com um ou mais lead IDs separados por virgula.");
}

const response = await fetch(`${baseUrl}/campaigns/indicacao/launch`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-kommo-secret": secret
  },
  body: JSON.stringify({
    leadIds,
    moveToStage
  })
});

const text = await response.text();
console.log(text);

if (!response.ok) {
  process.exit(1);
}

function parseLeadIds(value) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}
