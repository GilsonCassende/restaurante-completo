import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

export const campaignChannelValues = ["WHATSAPP", "EMAIL", "SMS", "PUSH"] as const;
export const campaignStatusValues = ["DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED"] as const;
export const campaignRecipientStatusValues = ["PENDING", "SENT", "DELIVERED", "FAILED"] as const;

export const campaignChannelSchema = z.enum(campaignChannelValues);
export const campaignStatusSchema = z.enum(campaignStatusValues);
export const campaignRecipientStatusSchema = z.enum(campaignRecipientStatusValues);

export const campaignSchema = z.object({
  name: z.string().min(2).max(120),
  channel: campaignChannelSchema,
  status: campaignStatusSchema.default("DRAFT"),
  subject: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  audience: z.array(z.string()).default([]),
  scheduledAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const campaignRecipientSchema = z.object({
  campaignId: idSchema,
  customerId: idSchema,
  status: campaignRecipientStatusSchema.default("PENDING"),
  deliveredAt: z.string().optional().nullable(),
});

export const campaignFilterSchema = paginationSchema.extend({
  search: z.string().optional().default(""),
  channel: campaignChannelSchema.optional().or(z.literal("all")).default("all"),
  status: campaignStatusSchema.optional().or(z.literal("all")).default("all"),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignRecipientInput = z.infer<typeof campaignRecipientSchema>;
export type CampaignFilterInput = z.infer<typeof campaignFilterSchema>;
