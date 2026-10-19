import fs from "node:fs/promises";

const repo = new URL("../", import.meta.url);
const reportPath = new URL("docs/meta-ads-ultimo-mes/index.html", repo);
const accessToken = process.env.META_ACCESS_TOKEN;
const igUserId = process.env.META_IG_USER_ID;
const adAccountId = process.env.META_AD_ACCOUNT_ID;
const graphVersion = process.env.META_GRAPH_VERSION || "v22.0";

if (!accessToken || !igUserId || !adAccountId) {
  throw new Error("Configure META_ACCESS_TOKEN, META_IG_USER_ID and META_AD_ACCOUNT_ID in GitHub Secrets.");
}

const now = new Date();
const iso = (date) => date.toISOString().slice(0, 10);
const today = iso(now);
const yearStart = `${now.getUTCFullYear()}-01-01`;
const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
const monthNames = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const monthPeriod = `${monthNames[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

async function graphGet(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path}`);
  Object.entries({ ...params, access_token: accessToken }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(`Meta API ${response.status}: ${body.error?.message || response.statusText}`);
  return body;
}

async function fetchAll(path, params) {
  const rows = [];
  let page = await graphGet(path, params);
  rows.push(...(page.data || []));
  while (page.paging?.next) {
    const response = await fetch(page.paging.next);
    page = await response.json();
    if (page.error) throw new Error(page.error.message);
    rows.push(...(page.data || []));
  }
  return rows;
}

async function insightMetric(since, until, metric) {
  const rows = await fetchAll(`${igUserId}/insights`, {
    metric,
    period: "day",
    since,
    until,
  });
  return rows.reduce((total, row) => {
    const values = Array.isArray(row.values) ? row.values : [];
    return total + values.reduce((subtotal, item) => subtotal + Number(item.value || 0), 0);
  }, 0);
}

async function readOrganic(since, until) {
  const metrics = [
    ["Visualizacoes", "impressions"],
    ["Alcance", "reach"],
    ["Interacoes com o conteudo", "total_interactions"],
    ["Cliques no link", "website_clicks"],
    ["Visitas ao perfil", "profile_views"],
    ["Seguidores", "follows_count"],
  ];
  const rows = [];
  for (const [metric, apiMetric] of metrics) {
    try {
      rows.push({ metric, value: await insightMetric(since, until, apiMetric) });
    } catch (error) {
      console.warn(`Metric ${apiMetric} unavailable: ${error.message}`);
    }
  }
  if (!rows.length) throw new Error("Meta API returned no organic Instagram metrics.");
  return rows;
}

async function readPaid(since, until) {
  return fetchAll(`act_${adAccountId}/insights`, {
    level: "campaign",
    fields: "campaign_name,objective,spend,impressions,reach,actions",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });
}

function campaignResults(row) {
  return (row.actions || [])
    .filter((action) => /messaging_conversation_started|lead|purchase/i.test(action.action_type || ""))
    .reduce((total, action) => total + Number(action.value || 0), 0);
}

function replaceRows(rows, period, source, scope) {
  return rows.map(({ metric, value }) => ({
    channel: "Organico",
    period,
    campaign: "Perfil Instagram",
    metric,
    value: Math.round(value),
    source,
    ...(scope ? { scope } : {}),
  }));
}

const [monthlyOrganic, ytdOrganic, paidRows] = await Promise.all([
  readOrganic(monthStart, today),
  readOrganic(yearStart, today),
  readPaid(monthStart, today),
]);

const html = await fs.readFile(reportPath, "utf8");
const startMarker = "const REPORT_DATA = ";
const endMarker = ";\n\nconst currency";
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Could not locate REPORT_DATA in the dashboard.");

const data = JSON.parse(html.slice(start + startMarker.length, end));
const source = `Meta Graph API ${monthStart} a ${today}`;
const ytdSource = `Meta Graph API ${yearStart} a ${today}`;
data.organicRows = data.organicRows.filter((row) => !(
  (row.period === monthPeriod && row.scope !== "ytd") ||
  (row.period === `Ano ${now.getUTCFullYear()}` && row.scope === "ytd")
));
data.organicRows.push(...replaceRows(monthlyOrganic, monthPeriod, source));
data.organicRows.push(...replaceRows(ytdOrganic, `Ano ${now.getUTCFullYear()}`, ytdSource, "ytd"));

const paidPeriodRows = paidRows.map((row) => ({
  channel: "Pago",
  period: monthPeriod,
  campaign: row.campaign_name || "Campanha sem nome",
  status: "Atualizado via API",
  objective: row.objective || "Outros",
  result_type: "Resultados da Meta API",
  results: campaignResults(row),
  cost_per_result_brl: campaignResults(row) ? Number(row.spend || 0) / campaignResults(row) : 0,
  budget_brl: 0,
  budget_type: "API",
  spend_brl: Number(row.spend || 0),
  impressions: Number(row.impressions || 0),
  reach: Number(row.reach || 0),
  end_date: today,
  attribution: "Meta Graph API",
  source: source,
}));
data.paidRows = data.paidRows.filter((row) => row.period !== monthPeriod);
data.paidRows.push(...paidPeriodRows);
data.billingRows = data.billingRows.filter((row) => row.period !== monthPeriod);
data.billingRows.push({
  period: monthPeriod,
  spend_brl: paidPeriodRows.reduce((total, row) => total + row.spend_brl, 0),
  source: "Meta Graph API",
  note: `Soma das campanhas retornadas no recorte ${monthStart} a ${today}.`,
});
data.updatedAt = new Date().toLocaleDateString("pt-BR");

const updated = html.slice(0, start) + startMarker + JSON.stringify(data) + endMarker + html.slice(end + endMarker.length);
await fs.writeFile(reportPath, updated, "utf8");
console.log(`Synchronized ${monthlyOrganic.length} organic metrics and ${paidPeriodRows.length} paid campaigns for ${monthPeriod}.`);
