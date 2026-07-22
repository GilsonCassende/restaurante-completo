import "server-only";

import { randomUUID } from "node:crypto";
import { createJobQueueManager } from "../jobs";
import type {
  EmailHistoryEntry,
  EmailLayoutDefinition,
  EmailMessage,
  EmailRenderResult,
  EmailServiceOptions,
  EmailTemplateDefinition,
  EmailProviderAdapter,
} from "./types";
import { buildEmailMessageSummary } from "./provider";

type EmailTenantStore = {
  history: EmailHistoryEntry[];
  templates: Map<string, EmailTemplateDefinition>;
  layouts: Map<string, EmailLayoutDefinition>;
};

const stores = new Map<string, EmailTenantStore>();

function getStore(tenantId: string) {
  const current = stores.get(tenantId);
  if (current) return current;
  const store: EmailTenantStore = {
    history: [],
    templates: new Map(),
    layouts: new Map(),
  };
  stores.set(tenantId, store);
  return store;
}

function now() {
  return new Date();
}

function normalizeRecipients(to: EmailMessage["to"]) {
  return Array.isArray(to) ? to : [to];
}

function buildRecipientList(message: EmailMessage) {
  return normalizeRecipients(message.to).map((recipient) => recipient.email);
}

function renderTemplate(template: EmailTemplateDefinition, message: EmailMessage, layout?: EmailLayoutDefinition | null): EmailRenderResult {
  const header = layout?.header ? `${layout.header}\n` : "";
  const footer = layout?.footer ? `\n${layout.footer}` : "";
  const html = message.html ?? `${header}${template.html}${footer}`;
  const text = message.text ?? template.text ?? template.subject;
  return {
    subject: message.subject || template.subject,
    html,
    text,
  };
}

function defaultRender(message: EmailMessage) {
  const html = message.html ?? `<p>${message.subject}</p>`;
  const text = message.text ?? message.subject;
  return { subject: message.subject, html, text };
}

function pushHistory(tenantId: string, entry: EmailHistoryEntry) {
  const store = getStore(tenantId);
  store.history.push(entry);
  return entry;
}

function createHistoryEntry(
  provider: EmailProviderAdapter,
  message: EmailMessage,
  status: EmailHistoryEntry["status"],
  jobId: string | null,
  metadata?: Record<string, unknown> | null,
  error?: string | null
) {
  return {
    id: randomUUID(),
    tenantId: message.tenantId,
    provider: provider.name,
    subject: message.subject,
    recipients: buildRecipientList(message),
    status,
    error: error ?? null,
    jobId,
    createdAt: now(),
    updatedAt: now(),
    metadata: metadata ?? null,
    message,
  } satisfies EmailHistoryEntry;
}

export function createEmailService(provider: EmailProviderAdapter, options?: EmailServiceOptions) {
  const queueManager = options?.queueManager ?? createJobQueueManager(options?.queueName ?? "email");
  const queueName = options?.queueName ?? "email";

  queueManager.registerHandler("email.send", async ({ job }) => {
    const payload = job.payload as { message: EmailMessage; attempt?: number };
    const message = payload.message;

    try {
      const response = await provider.send(message);
      pushHistory(
        message.tenantId,
        createHistoryEntry(provider, message, "sent", job.id, {
          response,
          queueName,
          summary: buildEmailMessageSummary(message),
          attempt: job.attempts,
        })
      );
      return { messageId: response.messageId };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Email send failed.";
      pushHistory(
        message.tenantId,
        createHistoryEntry(provider, message, "failed", job.id, {
          queueName,
          summary: buildEmailMessageSummary(message),
          attempt: job.attempts,
        }, reason)
      );
      throw error;
    }
  });

  return {
    provider,
    queueManager,
    async send(message: EmailMessage) {
      const response = await provider.send(message);
      pushHistory(
        message.tenantId,
        createHistoryEntry(provider, message, "sent", null, {
          response,
          queueName,
          summary: buildEmailMessageSummary(message),
        })
      );
      return response;
    },
    async queue(message: EmailMessage, metadata?: Record<string, unknown> | null) {
      pushHistory(
        message.tenantId,
        createHistoryEntry(provider, message, "queued", null, {
          queueName,
          summary: buildEmailMessageSummary(message),
          ...(metadata ?? {}),
        })
      );

      return queueManager.enqueue({
        tenantId: message.tenantId,
        queue: queueName,
        type: "email.send",
        payload: { message, attempt: 1 },
        metadata: metadata ?? null,
      });
    },
    async preview(message: EmailMessage) {
      const store = getStore(message.tenantId);
      const template = message.templateId ? store.templates.get(message.templateId) ?? null : null;
      const layout = template?.layoutId ? store.layouts.get(template.layoutId) ?? null : null;
      const rendered = provider.preview ? await provider.preview(message) : template ? renderTemplate(template, message, layout) : defaultRender(message);
      pushHistory(
        message.tenantId,
        createHistoryEntry(provider, message, "preview", null, {
          preview: true,
          queueName,
        })
      );
      return rendered;
    },
    registerTemplate(template: EmailTemplateDefinition) {
      const tenantId = template.tenantId ?? "global";
      const store = getStore(tenantId);
      store.templates.set(template.id, template);
      return template;
    },
    registerLayout(layout: EmailLayoutDefinition) {
      const tenantId = layout.tenantId ?? "global";
      const store = getStore(tenantId);
      store.layouts.set(layout.id, layout);
      return layout;
    },
    getTemplate(tenantId: string, templateId: string) {
      return getStore(tenantId).templates.get(templateId) ?? null;
    },
    getLayout(tenantId: string, layoutId: string) {
      return getStore(tenantId).layouts.get(layoutId) ?? null;
    },
    listTemplates(tenantId: string) {
      return Array.from(getStore(tenantId).templates.values());
    },
    listLayouts(tenantId: string) {
      return Array.from(getStore(tenantId).layouts.values());
    },
    listHistory(tenantId: string) {
      return getStore(tenantId).history.slice().reverse();
    },
    render(message: EmailMessage) {
      const store = getStore(message.tenantId);
      const template = message.templateId ? store.templates.get(message.templateId) ?? null : null;
      const layout = template?.layoutId ? store.layouts.get(template.layoutId) ?? null : null;
      return template ? renderTemplate(template, message, layout) : defaultRender(message);
    },
  };
}
