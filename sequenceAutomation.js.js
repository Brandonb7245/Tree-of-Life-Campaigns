#!/usr/bin/env node
// sequenceAutomation.js - Automated email sequence processor
import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and, sql } from 'drizzle-orm';
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// Database schema definitions - inline for standalone deployment
const emailSequences = pgTable("email_sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const sequenceSteps = pgTable("sequence_steps", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").references(() => emailSequences.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  templateId: integer("template_id").notNull(),
  delayDays: integer("delay_days").notNull().default(1),
  isActive: boolean("is_active").default(true),
});

const sequenceSubscribers = pgTable("sequence_subscribers", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").references(() => emailSequences.id).notNull(),
  leadId: integer("lead_id").notNull(),
  currentStep: integer("current_step").default(0),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastEmailSent: timestamp("last_email_sent"),
  nextEmailDue: timestamp("next_email_due"),
});

const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  unsubscribeText: text("unsubscribe_text").default("If you no longer wish to receive these emails, you may unsubscribe here."),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
});

const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  resendId: text("resend_id").notNull(),
  status: text("status").notNull().default("sent"),
});

const unsubscribes = pgTable("unsubscribes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  reason: text("reason"),
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow().notNull(),
});

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!RESEND_API_KEY || !DATABASE_URL) {
  console.error('Missing required environment variables: RESEND_API_KEY, DATABASE_URL');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const sql_client = neon(DATABASE_URL);
const db = drizzle(sql_client);

class SequenceAutomation {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.emailsSentToday = 0;
    this.dailyLimit = 100;
  }

  async start() {
    console.log('🚀 Starting Email Sequence Automation...');
    this.isRunning = true;
    
    await this.processPendingEmails();
    
    this.intervalId = setInterval(() => {
      this.processPendingEmails();
    }, 15 * 60 * 1000); // 15 minutes
    
    console.log('✅ Sequence automation is now running (checking every 15 minutes)');
  }

  async stop() {
    console.log('🛑 Stopping Email Sequence Automation...');
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  isBusinessHours() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = estTime.getHours();
    const day = estTime.getDay();
    
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 18;
  }

  async isUnsubscribed(email) {
    try {
      const result = await db.select().from(unsubscribes).where(eq(unsubscribes.email, email));
      return result.length > 0;
    } catch (error) {
      console.error('Error checking unsubscribe status:', error);
      return false;
    }
  }

  async processPendingEmails() {
    if (!this.isBusinessHours()) {
      console.log('⏰ Outside business hours - sequence processing paused');
      return;
    }

    if (this.emailsSentToday >= this.dailyLimit) {
      console.log(`📈 Daily limit reached (${this.dailyLimit} emails) - sequence processing paused`);
      return;
    }

    try {
      console.log('🔄 Processing pending sequence emails...');
      
      const now = new Date();
      const pendingSubscribers = await db
        .select()
        .from(sequenceSubscribers)
        .where(
          and(
            eq(sequenceSubscribers.status, 'active'),
            sql`${sequenceSubscribers.nextEmailDue} <= ${now}`
          )
        )
        .limit(10);

      if (pendingSubscribers.length === 0) {
        console.log('📭 No pending sequence emails to process');
        return;
      }

      console.log(`📊 Processing ${pendingSubscribers.length} pending sequence emails`);

      for (const subscriber of pendingSubscribers) {
        if (this.emailsSentToday >= this.dailyLimit) break;
        
        await this.processSubscriberEmail(subscriber);
      }
      
    } catch (error) {
      console.error('❌ Error processing sequence emails:', error);
    }
  }

  async processSubscriberEmail(subscriber) {
    try {
      // Get lead information
      const lead = await db.select().from(leads).where(eq(leads.id, subscriber.leadId)).limit(1);
      if (!lead[0] || !lead[0].isActive) {
        console.log(`⚠️ Lead not found or inactive: ${subscriber.leadId}`);
        return;
      }

      // Check if unsubscribed
      if (await this.isUnsubscribed(lead[0].email)) {
        await db
          .update(sequenceSubscribers)
          .set({ status: 'unsubscribed', completedAt: new Date() })
          .where(eq(sequenceSubscribers.id, subscriber.id));
        
        console.log(`🚫 Subscriber unsubscribed: ${lead[0].email}`);
        return;
      }

      // Get next step
      const nextStepNumber = subscriber.currentStep + 1;
      const nextStep = await db
        .select()
        .from(sequenceSteps)
        .where(
          and(
            eq(sequenceSteps.sequenceId, subscriber.sequenceId),
            eq(sequenceSteps.stepNumber, nextStepNumber),
            eq(sequenceSteps.isActive, true)
          )
        )
        .limit(1);

      if (!nextStep[0]) {
        // No more steps - complete sequence
        await db
          .update(sequenceSubscribers)
          .set({ 
            status: 'completed', 
            completedAt: new Date(),
            currentStep: nextStepNumber - 1
          })
          .where(eq(sequenceSubscribers.id, subscriber.id));
        
        console.log(`✅ Sequence completed for: ${lead[0].email}`);
        return;
      }

      // Get template
      const template = await db.select().from(emailTemplates).where(eq(emailTemplates.id, nextStep[0].templateId)).limit(1);
      if (!template[0]) {
        console.log(`⚠️ Template not found: ${nextStep[0].templateId}`);
        return;
      }

      // Send email
      const result = await this.sendSequenceEmail(lead[0], template[0], subscriber);
      
      if (result) {
        // Update subscriber progress
        const nextEmailDue = new Date();
        const followingStep = await db
          .select()
          .from(sequenceSteps)
          .where(
            and(
              eq(sequenceSteps.sequenceId, subscriber.sequenceId),
              eq(sequenceSteps.stepNumber, nextStepNumber + 1),
              eq(sequenceSteps.isActive, true)
            )
          )
          .limit(1);

        if (followingStep[0]) {
          nextEmailDue.setDate(nextEmailDue.getDate() + followingStep[0].delayDays);
        }

        await db
          .update(sequenceSubscribers)
          .set({
            currentStep: nextStepNumber,
            lastEmailSent: new Date(),
            nextEmailDue: followingStep[0] ? nextEmailDue : null
          })
          .where(eq(sequenceSubscribers.id, subscriber.id));

        this.emailsSentToday++;
        console.log(`✅ Sequence email sent to ${lead[0].email} (Step ${nextStepNumber})`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing subscriber ${subscriber.id}:`, error);
    }
  }

  async sendSequenceEmail(lead, template, subscriber) {
    try {
      const personalizedSubject = template.subject.replace(/{{firstName}}/g, lead.firstName || 'Friend');
      const personalizedContent = template.content
        .replace(/{{firstName}}/g, lead.firstName || 'Friend')
        .replace(/{{unsubscribeLink}}/g, `https://treeoflifeagencies.com/unsubscribe?email=${encodeURIComponent(lead.email)}`);

      const emailData = {
        from: 'Brandon Burke <brandonb@treeoflifeagencies.com>',
        to: [lead.email],
        subject: personalizedSubject,
        html: personalizedContent,
      };

      const result = await resend.emails.send(emailData);

      if (result.data?.id) {
        // Log the email
        await db.insert(emailLogs).values({
          campaignId: null, // Sequence emails don't have campaign IDs
          recipientEmail: lead.email,
          recipientName: `${lead.firstName} ${lead.lastName || ''}`,
          subject: personalizedSubject,
          htmlContent: personalizedContent,
          resendId: result.data.id,
          status: 'sent',
        });

        return result;
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to send sequence email to ${lead.email}:`, error.message);
      return null;
    }
  }
}

// Main execution
const automation = new SequenceAutomation();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📥 Received SIGTERM, shutting down gracefully');
  await automation.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📥 Received SIGINT, shutting down gracefully');
  await automation.stop();
  process.exit(0);
});

// Start the automation
automation.start().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});