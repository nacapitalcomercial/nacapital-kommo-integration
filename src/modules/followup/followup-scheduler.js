import { error, log } from "../../logger.js";

export class FollowupScheduler {
  constructor({ kommo, store, pollMs, defaultResponsibleId }) {
    this.kommo = kommo;
    this.store = store;
    this.pollMs = pollMs;
    this.defaultResponsibleId = defaultResponsibleId;
    this.timer = null;
    this.running = false;
  }

  start() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollMs);

    if (typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }

  stop() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  schedule(plan) {
    if (!Array.isArray(plan?.followups) || plan.followups.length === 0) {
      return [];
    }

    return this.store.addFollowups(plan.followups);
  }

  async tick() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const dueItems = this.store.claimDueFollowups();

      for (const item of dueItems) {
        try {
          const task = await this.kommo.createTask({
            text: item.taskText,
            entityId: item.leadId,
            responsibleUserId: item.responsibleUserId || this.defaultResponsibleId,
            completeTill: unixMinutesFromNow(30)
          });

          if (item.noteText) {
            await this.kommo.addLeadNote(item.leadId, item.noteText);
          }

          this.store.completeFollowup(item.key, {
            ok: true,
            taskId: task?.id || null
          });

          log("Follow-up executed", {
            leadId: item.leadId,
            key: item.key,
            label: item.label
          });
        } catch (err) {
          this.store.failFollowup(item.key, err.message);
          error("Follow-up execution failed", {
            leadId: item.leadId,
            key: item.key,
            err
          });
        }
      }
    } finally {
      this.running = false;
    }
  }
}

function unixMinutesFromNow(minutes) {
  return Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
}
