import type { JobDefinition } from "../jobs";

export type EmailProviderName = "smtp" | "resend" | "sendgrid" | "brevo";

export type EmailAddress = {
  email: string;
  name?: string | null;
};

export type EmailMessage = {
  tenantId: string;
  to: EmailAddress | EmailAddress[];
  subject: string;
  html?: string | null;
  text?: string | null;
  from?: EmailAddress | null;
  replyTo?: EmailAddress | null;
  metadata?: Record<string, unknown> | null;
  templateId?: string | null;
};

export type EmailTemplateContext = {
  tenantId: string;
  locale?: string;
  [key: string]: unknown;
};

export type EmailTemplateDefinition = {
  id: string;
  tenantId?: string | null;
  name: string;
  subject: string;
  html: string;
  text?: string;
  layoutId?: string | null;
};

export type EmailLayoutDefinition = {
  id: string;
  tenantId?: string | null;
  name: string;
  header?: string;
  footer?: string;
};

export type EmailLogEntry = {
  id: string;
  tenantId: string;
  provider: EmailProviderName;
  subject: string;
  recipients: string[];
  status: "queued" | "sent" | "failed" | "preview";
  error: string | null;
  jobId: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown> | null;
};

export type EmailHistoryEntry = EmailLogEntry & {
  message: EmailMessage;
};

export type EmailProviderAdapter = {
  name: EmailProviderName;
  send(message: EmailMessage): Promise<{ messageId: string; queued: boolean; provider: EmailProviderName }>;
  preview?(message: EmailMessage): Promise<{ html: string; text: string | null }>;
};

export type EmailRenderResult = {
  subject: string;
  html: string;
  text: string | null;
};

export type EmailServiceOptions = {
  queueManager?: import("../jobs").JobQueueManager;
  queueName?: string;
};

export type EmailQueuePayload = {
  message: EmailMessage;
  attempt: number;
};

export type EmailJob = JobDefinition<EmailQueuePayload, { messageId: string }>;
