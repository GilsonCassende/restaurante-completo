import type { JobDefinition } from "../jobs";

export type NotificationChannel = "email" | "whatsapp" | "sms" | "push" | "in_app";

export type NotificationPriority = "low" | "normal" | "high";

export type NotificationRecipient = {
  tenantId: string;
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  pushToken?: string | null;
};

export type NotificationMessage = {
  tenantId: string;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  title: string;
  body: string;
  templateId?: string | null;
  metadata?: Record<string, unknown> | null;
  scheduledAt?: Date | null;
  priority?: NotificationPriority;
};

export type NotificationHistoryEntry = {
  id: string;
  tenantId: string;
  channel: NotificationChannel;
  title: string;
  recipient: NotificationRecipient;
  status: "queued" | "sent" | "failed" | "scheduled";
  error: string | null;
  jobId: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown> | null;
};

export type NotificationTemplateDefinition = {
  id: string;
  tenantId?: string | null;
  name: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
};

export type NotificationHistoryFilter = {
  tenantId?: string;
  channel?: NotificationChannel;
  userId?: string;
};

export type NotificationAdapter = {
  channel: NotificationChannel;
  send(message: NotificationMessage): Promise<{ messageId: string; accepted: boolean }>;
  preview?(message: NotificationMessage): Promise<{ title: string; body: string }>;
};

export type NotificationJob = JobDefinition<NotificationMessage, { messageId: string }>;
