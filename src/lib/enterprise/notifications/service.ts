import "server-only";

import { randomUUID } from "node:crypto";
import { createJobQueueManager, type JobQueueManager } from "../jobs";
import type {
  NotificationAdapter,
  NotificationChannel,
  NotificationHistoryEntry,
  NotificationMessage,
  NotificationTemplateDefinition,
} from "./types";

type NotificationTenantStore = {
  history: NotificationHistoryEntry[];
  templates: Map<string, NotificationTemplateDefinition>;
  preferences: Map<string, Record<string, boolean>>;
};

const stores = new Map<string, NotificationTenantStore>();

function getStore(tenantId: string) {
  const current = stores.get(tenantId);
  if (current) return current;
  const store: NotificationTenantStore = {
    history: [],
    templates: new Map(),
    preferences: new Map(),
  };
  stores.set(tenantId, store);
  return store;
}

function now() {
  return new Date();
}

function createHistoryEntry(
  channel: NotificationChannel,
  message: NotificationMessage,
  status: NotificationHistoryEntry["status"],
  jobId: string | null,
  metadata?: Record<string, unknown> | null,
  error?: string | null
) {
  return {
    id: randomUUID(),
    tenantId: message.tenantId,
    channel,
    title: message.title,
    recipient: message.recipient,
    status,
    error: error ?? null,
    jobId,
    createdAt: now(),
    updatedAt: now(),
    metadata: metadata ?? null,
  } satisfies NotificationHistoryEntry;
}

function listRecipientIdentifiers(message: NotificationMessage) {
  return [message.recipient.email, message.recipient.phone, message.recipient.pushToken, message.recipient.userId]
    .filter(Boolean)
    .map(String);
}

function shouldDeliver(message: NotificationMessage) {
  const preferences = getStore(message.tenantId).preferences.get(message.recipient.userId ?? "") ?? {};
  return preferences[message.channel] !== false;
}

export function createNotificationService(
  adapters: NotificationAdapter[],
  options?: {
    queueManager?: JobQueueManager;
    queueName?: string;
  }
) {
  const queueManager = options?.queueManager ?? createJobQueueManager(options?.queueName ?? "notifications");
  const queueName = options?.queueName ?? "notifications";

  for (const adapter of adapters) {
    queueManager.registerHandler(`notification.${adapter.channel}`, async ({ job }) => {
      const message = job.payload as NotificationMessage;
      if (!shouldDeliver(message)) {
        const store = getStore(message.tenantId);
        store.history.push(
          createHistoryEntry(adapter.channel, message, "failed", job.id, {
            reason: "preference_blocked",
            queueName,
          })
        );
        return { messageId: `blocked_${job.id}` };
      }

      try {
        const response = await adapter.send(message);
        const store = getStore(message.tenantId);
        store.history.push(
          createHistoryEntry(adapter.channel, message, "sent", job.id, {
            response,
            queueName,
            recipients: listRecipientIdentifiers(message),
            attempt: job.attempts,
          })
        );
        return { messageId: response.messageId };
      } catch (error) {
        const store = getStore(message.tenantId);
        store.history.push(
          createHistoryEntry(
            adapter.channel,
            message,
            "failed",
            job.id,
            {
              queueName,
              recipients: listRecipientIdentifiers(message),
              attempt: job.attempts,
            },
            error instanceof Error ? error.message : "Notification send failed."
          )
        );
        throw error;
      }
    });
  }

  return {
    queueManager,
    async send(message: NotificationMessage) {
      if (!shouldDeliver(message)) {
        const store = getStore(message.tenantId);
        const entry = createHistoryEntry(message.channel, message, "failed", null, {
          reason: "preference_blocked",
          queueName,
        });
        store.history.push(entry);
        return { messageId: `blocked_${entry.id}`, accepted: false };
      }

      const adapter = adapters.find((item) => item.channel === message.channel) ?? null;
      if (!adapter) {
        throw new Error(`Canal ${message.channel} indisponível.`);
      }

      const response = await adapter.send(message);
      const store = getStore(message.tenantId);
      store.history.push(
        createHistoryEntry(message.channel, message, "sent", null, {
          response,
          queueName,
          recipients: listRecipientIdentifiers(message),
        })
      );
      return response;
    },
    async queue(message: NotificationMessage) {
      const store = getStore(message.tenantId);
      store.history.push(
        createHistoryEntry(message.channel, message, "queued", null, {
          queueName,
          recipients: listRecipientIdentifiers(message),
        })
      );

      return queueManager.enqueue({
        tenantId: message.tenantId,
        queue: queueName,
        type: `notification.${message.channel}`,
        payload: message,
        priority: message.priority ?? "normal",
        scheduledAt: message.scheduledAt ?? null,
      });
    },
    async preview(message: NotificationMessage) {
      const adapter = adapters.find((item) => item.channel === message.channel) ?? null;
      return adapter?.preview ? adapter.preview(message) : { title: message.title, body: message.body };
    },
    registerTemplate(template: NotificationTemplateDefinition) {
      const tenantId = template.tenantId ?? "global";
      const store = getStore(tenantId);
      store.templates.set(template.id, template);
      return template;
    },
    setPreference(tenantId: string, userId: string, preferences: Record<string, boolean>) {
      const store = getStore(tenantId);
      store.preferences.set(userId, preferences);
      return preferences;
    },
    getPreference(tenantId: string, userId: string) {
      return getStore(tenantId).preferences.get(userId) ?? {};
    },
    getTemplate(tenantId: string, templateId: string) {
      return getStore(tenantId).templates.get(templateId) ?? null;
    },
    listTemplates(tenantId: string) {
      return Array.from(getStore(tenantId).templates.values());
    },
    listHistory(tenantId: string) {
      return getStore(tenantId).history.slice().reverse();
    },
    shouldDeliver,
  };
}
