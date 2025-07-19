import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  source: text("source").default("manual"),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  customFields: jsonb("custom_fields").default({}), // Store all additional CSV fields
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  sendTo: text("send_to"), // Optional field for personalized recipient
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  resendId: text("resend_id").notNull(),
  status: text("status").notNull().default("sent"), // sent, delivered, bounced, failed
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  metadata: jsonb("metadata"),
});

export const emailResponses = pgTable("email_responses", {
  id: serial("id").primaryKey(),
  emailLogId: integer("email_log_id").references(() => emailLogs.id),
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name"),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
});

export const scheduledCampaigns = pgTable("scheduled_campaigns", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(50),
  batchSize: integer("batch_size").notNull().default(10),
  mode: text("mode").notNull().default("csv"), // csv, personalized, batch
  scheduledFor: timestamp("scheduled_for").notNull(),
  recurringEnabled: boolean("recurring_enabled").notNull().default(false),
  recurringFrequency: text("recurring_frequency"), // hourly, daily, weekly, monthly
  status: text("status").notNull().default("pending"), // pending, running, completed, paused
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastRunAt: timestamp("last_run_at"),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  unsubscribeText: text("unsubscribe_text").default("If you no longer wish to receive these emails, you may unsubscribe here."),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const unsubscribes = pgTable("unsubscribes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  reason: text("reason"),
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow().notNull(),
});

export const emailSequences = pgTable("email_sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sequenceSteps = pgTable("sequence_steps", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").references(() => emailSequences.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  templateId: integer("template_id").references(() => emailTemplates.id).notNull(),
  delayDays: integer("delay_days").notNull().default(1),
  isActive: boolean("is_active").default(true),
});

export const sequenceSubscribers = pgTable("sequence_subscribers", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").references(() => emailSequences.id).notNull(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  currentStep: integer("current_step").default(0),
  status: text("status").notNull().default("active"), // active, completed, paused, unsubscribed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastEmailSent: timestamp("last_email_sent"),
  nextEmailDue: timestamp("next_email_due"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertLeadSchema = createInsertSchema(leads);
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns);
export const insertEmailLogSchema = createInsertSchema(emailLogs);
export const insertEmailResponseSchema = createInsertSchema(emailResponses);
export const insertScheduledCampaignSchema = createInsertSchema(scheduledCampaigns);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const insertUnsubscribeSchema = createInsertSchema(unsubscribes);
export const insertEmailSequenceSchema = createInsertSchema(emailSequences);
export const insertSequenceStepSchema = createInsertSchema(sequenceSteps);
export const insertSequenceSubscriberSchema = createInsertSchema(sequenceSubscribers);

// Types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type EmailResponse = typeof emailResponses.$inferSelect;
export type ScheduledCampaign = typeof scheduledCampaigns.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Unsubscribe = typeof unsubscribes.$inferSelect;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type SequenceSubscriber = typeof sequenceSubscribers.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type InsertEmailResponse = z.infer<typeof insertEmailResponseSchema>;
export type InsertScheduledCampaign = z.infer<typeof insertScheduledCampaignSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type InsertUnsubscribe = z.infer<typeof insertUnsubscribeSchema>;
export type InsertEmailSequence = z.infer<typeof insertEmailSequenceSchema>;
export type InsertSequenceStep = z.infer<typeof insertSequenceStepSchema>;
export type InsertSequenceSubscriber = z.infer<typeof insertSequenceSubscriberSchema>;