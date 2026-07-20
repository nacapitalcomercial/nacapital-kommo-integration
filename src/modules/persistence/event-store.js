import fs from "node:fs";
import path from "node:path";

const EMPTY_STATE = {
  events: [],
  followups: []
};

export class EventStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.ensureDir();
        this.persist(EMPTY_STATE);
        return structuredClone(EMPTY_STATE);
      }

      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = raw ? JSON.parse(raw) : structuredClone(EMPTY_STATE);

      return {
        events: Array.isArray(parsed.events) ? parsed.events : [],
        followups: Array.isArray(parsed.followups) ? parsed.followups : []
      };
    } catch {
      return structuredClone(EMPTY_STATE);
    }
  }

  ensureDir() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  persist(nextState = this.state) {
    this.ensureDir();
    fs.writeFileSync(this.filePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
  }

  appendEvent(event) {
    this.state.events.push(event);
    this.persist();
    return event;
  }

  addFollowups(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    const existingKeys = new Set(this.state.followups.map((item) => item.key));
    const accepted = [];

    for (const entry of entries) {
      if (!entry?.key || existingKeys.has(entry.key)) {
        continue;
      }

      const record = {
        ...entry,
        status: entry.status || "pending",
        createdAt: entry.createdAt || new Date().toISOString(),
        processedAt: entry.processedAt || null,
        result: entry.result || null
      };

      this.state.followups.push(record);
      existingKeys.add(record.key);
      accepted.push(record);
    }

    this.persist();
    return accepted;
  }

  claimDueFollowups(nowIso = new Date().toISOString()) {
    const now = new Date(nowIso).getTime();
    const claimed = [];

    for (const item of this.state.followups) {
      if (item.status !== "pending") {
        continue;
      }

      if (new Date(item.executeAt).getTime() > now) {
        continue;
      }

      item.status = "processing";
      item.processingStartedAt = nowIso;
      claimed.push({ ...item });
    }

    if (claimed.length) {
      this.persist();
    }

    return claimed;
  }

  completeFollowup(key, result) {
    const item = this.state.followups.find((entry) => entry.key === key);
    if (!item) {
      return null;
    }

    item.status = "completed";
    item.processedAt = new Date().toISOString();
    item.result = result || null;
    this.persist();
    return item;
  }

  failFollowup(key, errorMessage) {
    const item = this.state.followups.find((entry) => entry.key === key);
    if (!item) {
      return null;
    }

    item.status = "failed";
    item.processedAt = new Date().toISOString();
    item.result = {
      ok: false,
      error: errorMessage
    };
    this.persist();
    return item;
  }

  getSummary() {
    return {
      totalEvents: this.state.events.length,
      totalFollowups: this.state.followups.length,
      pendingFollowups: this.state.followups.filter((item) => item.status === "pending").length,
      completedFollowups: this.state.followups.filter((item) => item.status === "completed").length,
      failedFollowups: this.state.followups.filter((item) => item.status === "failed").length
    };
  }

  listRecentEvents(limit = 100) {
    return this.state.events.slice(-limit).reverse();
  }

  listRecentFollowups(limit = 100) {
    return this.state.followups.slice(-limit).reverse();
  }
}
