#!/usr/bin/env node
// persistentCampaign.js - Standalone email campaign runner for Tree of Life Agencies
import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';

// Database schema definitions - inline for standalone deployment
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

const leads = pgTable("leads", {
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
  customFields: jsonb("custom_fields").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  sendTo: text("send_to"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  resendId: text("resend_id").notNull(),
  status: text("status").notNull().default("sent"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  metadata: jsonb("metadata"),
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
const BATCH_SIZE = 15;
const DAILY_LIMIT = 100;
const HOURS_BETWEEN_SENDS = 2;
const CAMPAIGN_ID = 1;

if (!RESEND_API_KEY || !DATABASE_URL) {
  console.error('Missing required environment variables: RESEND_API_KEY, DATABASE_URL');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const sql_client = neon(DATABASE_URL);
const db = drizzle(sql_client);

// Professional email template
const EMAIL_TEMPLATE = {
  subject: "Protect Your Family's Financial Future - Emergency Wealth Plan",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #2e5c5a 0%, #1a3f3d 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Emergency Wealth Plan</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Secure Your Family's Financial Future Today</p>
      </div>
      
      <!-- Main content -->
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #2e5c5a; margin: 0 0 20px 0; font-size: 24px;">Dear {{firstName}},</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
          What if I told you that <strong>7 hidden financial threats</strong> are blocking your family from true wealth and security? Most people don't discover these until it's too late.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">
          As a licensed financial educator partnered with Guardian Life Insurance, I've helped hundreds of families in Florida uncover these wealth blockers and transform their financial futures.
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="https://treeoflifeagencies.com" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; text-shadow: 0 1px 2px rgba(0,0,0,0.3); box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3); transition: all 0.3s ease;">
            Get Your FREE Emergency Wealth Plan →
          </a>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #2e5c5a; margin: 0 0 15px 0; font-size: 20px;">What You'll Discover Inside:</h3>
          <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>The #1 Financial Mistake</strong> that kills 90% of wealth-building plans</li>
            <li><strong>Hidden Tax Traps</strong> that could cost your family $100,000+</li>
            <li><strong>The Guardian Life Strategy</strong> that protects and grows your money simultaneously</li>
            <li><strong>Emergency Fund Secrets</strong> most financial advisors never mention</li>
          </ul>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">
          <strong>Brandon Burke</strong><br>
          Licensed Financial Educator<br>
          Tree of Life Agencies<br>
          Guardian Life Insurance Partner
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            📞 <strong>(334) 467-3090</strong> | 📧 <strong>brandonb@treeoflifeagencies.com</strong>
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0 0 10px 0;">© 2025 Tree of Life Agencies. All rights reserved.</p>
        <p style="margin: 0;">
          <a href="{{unsubscribeLink}}" style="color: #666; text-decoration: underline;">
            If you no longer wish to receive these emails, you may unsubscribe here.
          </a>
        </p>
      </div>
    </div>
  `
};

// Main functions
async function isBusinessHours() {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = estTime.getHours();
  const day = estTime.getDay();
  
  return day >= 1 && day <= 5 && hour >= 9 && hour <= 18;
}

async function isUnsubscribed(email) {
  try {
    const result = await db.select().from(unsubscribes).where(eq(unsubscribes.email, email));
    return result.length > 0;
  } catch (error) {
    console.error('Error checking unsubscribe status:', error);
    return false;
  }
}

async function getAvailableLeads(limit) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get contacts not emailed in the last 7 days for any campaign
    const recentlyEmailed = await db
      .select({ email: emailLogs.recipientEmail })
      .from(emailLogs)
      .where(sql`${emailLogs.sentAt} >= ${sevenDaysAgo}`);
    
    const recentEmailsList = recentlyEmailed.map(row => row.email);
    
    const availableLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.isActive, true),
          recentEmailsList.length > 0 ? sql`${leads.email} NOT IN (${recentEmailsList.join(',')})` : sql`1=1`
        )
      )
      .limit(limit);
    
    return availableLeads;
  } catch (error) {
    console.error('Error getting available leads:', error);
    return [];
  }
}

async function sendEmail(lead, campaign) {
  try {
    if (await isUnsubscribed(lead.email)) {
      console.log(`Skipping unsubscribed email: ${lead.email}`);
      return null;
    }
    
    const personalizedSubject = campaign.subject.replace('{{firstName}}', lead.firstName || 'Friend');
    const personalizedContent = campaign.htmlContent
      .replace(/{{firstName}}/g, lead.firstName || 'Friend')
      .replace(/{{unsubscribeLink}}/g, `https://treeoflifeagencies.com/unsubscribe?email=${encodeURIComponent(lead.email)}`);
    
    const emailData = {
      from: `${campaign.fromName} <${campaign.fromEmail}>`,
      to: [lead.email],
      subject: personalizedSubject,
      html: personalizedContent,
    };
    
    const result = await resend.emails.send(emailData);
    
    if (result.data?.id) {
      await db.insert(emailLogs).values({
        campaignId: campaign.id,
        recipientEmail: lead.email,
        recipientName: lead.firstName + ' ' + (lead.lastName || ''),
        subject: personalizedSubject,
        htmlContent: personalizedContent,
        resendId: result.data.id,
        status: 'sent',
      });
      
      console.log(`✅ Email sent to ${lead.email} (${lead.firstName})`);
      return result;
    }
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${lead.email}:`, error.message);
    return null;
  }
}

async function runCampaign() {
  console.log(`\n🚀 Starting campaign run at ${new Date().toISOString()}`);
  
  if (!await isBusinessHours()) {
    console.log('⏰ Outside business hours (9 AM - 6 PM EST, Mon-Fri). Skipping...');
    return;
  }
  
  try {
    // Get campaign
    const campaign = {
      id: CAMPAIGN_ID,
      name: 'Emergency Wealth Plan Campaign',
      fromName: 'Brandon Burke',
      fromEmail: 'brandonb@treeoflifeagencies.com',
      ...EMAIL_TEMPLATE
    };
    
    const availableLeads = await getAvailableLeads(DAILY_LIMIT);
    
    if (availableLeads.length === 0) {
      console.log('📭 No available leads to email at this time');
      return;
    }
    
    console.log(`📊 Found ${availableLeads.length} available leads`);
    
    // Send emails in batches
    const results = [];
    for (let i = 0; i < availableLeads.length; i += BATCH_SIZE) {
      const batch = availableLeads.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(lead => sendEmail(lead, campaign));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      if (i + BATCH_SIZE < availableLeads.length) {
        console.log(`⏳ Batch complete, waiting 30 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    console.log(`\n📈 Campaign completed: ${results.length} emails sent successfully`);
    
  } catch (error) {
    console.error('❌ Campaign error:', error);
  }
}

// Main execution
async function main() {
  console.log('🌳 Tree of Life Agencies - Persistent Campaign System');
  console.log('📧 Starting email campaign automation...');
  
  // Run immediately
  await runCampaign();
  
  // Set up recurring execution every 2 hours
  setInterval(async () => {
    await runCampaign();
  }, HOURS_BETWEEN_SENDS * 60 * 60 * 1000);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📥 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📥 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});