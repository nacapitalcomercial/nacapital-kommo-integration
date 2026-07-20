export class MetricsService {
  constructor({ store, recentLimit = 100 }) {
    this.store = store;
    this.recentLimit = recentLimit;
  }

  record({ event, result }) {
    return this.store.appendEvent({
      id: buildEventId(event, result),
      createdAt: new Date().toISOString(),
      eventType: event?.eventType || "unknown",
      leadId: result?.leadId || event?.leadId || null,
      contactId: event?.contactId || null,
      product: result?.product || null,
      intent: result?.intent || null,
      routingMode: result?.routingMode || null,
      routingChannel: result?.routingChannel || null,
      actions: Array.isArray(result?.actions) ? result.actions.map((item) => item.type) : []
    });
  }

  getSummary() {
    const base = this.store.getSummary();
    const events = this.store.listRecentEvents(5000).reverse();

    return {
      ...base,
      eventsByType: countBy(events, "eventType"),
      leadsByProduct: countBy(events, "product"),
      intents: countBy(events, "intent"),
      routingModes: countBy(events, "routingMode"),
      actionTypes: countActionTypes(events),
      lastEventAt: events.at(-1)?.createdAt || null
    };
  }

  getRecentEvents() {
    return this.store.listRecentEvents(this.recentLimit);
  }

  getRecentFollowups() {
    return this.store.listRecentFollowups(this.recentLimit);
  }
}

function buildEventId(event, result) {
  return [
    event?.eventType || "unknown",
    result?.leadId || event?.leadId || "no-lead",
    Date.now()
  ].join(":");
}

function countBy(list, key) {
  return list.reduce((acc, item) => {
    const value = item?.[key] || "nao_informado";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countActionTypes(list) {
  const counts = {};

  for (const item of list) {
    for (const action of item.actions || []) {
      counts[action] = (counts[action] || 0) + 1;
    }
  }

  return counts;
}
