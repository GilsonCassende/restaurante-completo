import "server-only";

import { randomUUID } from "node:crypto";
import type { NotificationAdapter, NotificationChannel, NotificationMessage } from "./types";

function createProvider(channel: NotificationChannel): NotificationAdapter {
  return {
    channel,
    async send(message) {
      void message;
      return {
        messageId: `${channel}_${randomUUID().slice(0, 12)}`,
        accepted: true,
      };
    },
    async preview(message: NotificationMessage) {
      return {
        title: message.title,
        body: message.body,
      };
    },
  };
}

export function createEmailNotificationAdapter() {
  return createProvider("email");
}

export function createWhatsAppNotificationAdapter() {
  return createProvider("whatsapp");
}

export function createSmsNotificationAdapter() {
  return createProvider("sms");
}

export function createPushNotificationAdapter() {
  return createProvider("push");
}

export function createInAppNotificationAdapter() {
  return createProvider("in_app");
}
