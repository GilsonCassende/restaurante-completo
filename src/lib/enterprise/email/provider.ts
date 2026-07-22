import "server-only";

import { randomUUID } from "node:crypto";
import type { EmailMessage, EmailProviderAdapter, EmailProviderName } from "./types";

function normalizeRecipients(to: EmailMessage["to"]) {
  return Array.isArray(to) ? to : [to];
}

function toRecipientList(to: EmailMessage["to"]) {
  return normalizeRecipients(to).map((recipient) => recipient.email);
}

export function createEmailProviderAdapter(name: EmailProviderName): EmailProviderAdapter {
  return {
    name,
    async send(message) {
      void message;
      return {
        messageId: `${name}_${randomUUID().slice(0, 12)}`,
        queued: true,
        provider: name,
      };
    },
    async preview(message) {
      return {
        html: message.html ?? `<p>${message.subject}</p>`,
        text: message.text ?? message.subject,
      };
    },
  };
}

export function createSmtpEmailProvider() {
  return createEmailProviderAdapter("smtp");
}

export function createResendEmailProvider() {
  return createEmailProviderAdapter("resend");
}

export function createSendGridEmailProvider() {
  return createEmailProviderAdapter("sendgrid");
}

export function createBrevoEmailProvider() {
  return createEmailProviderAdapter("brevo");
}

export function buildEmailMessageSummary(message: EmailMessage) {
  return {
    tenantId: message.tenantId,
    subject: message.subject,
    recipients: toRecipientList(message.to),
    hasHtml: Boolean(message.html),
    hasText: Boolean(message.text),
  };
}
