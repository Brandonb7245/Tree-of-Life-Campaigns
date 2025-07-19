#!/usr/bin/env node
// persistentCampaign.js - Standalone email campaign runner for Tree of Life Agencies
// Integrates with your existing database and campaign system
import fs from 'fs';
import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_CRpfFNWC_77Qm4RJYfzLeaoxuKEMUtaSt";
const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = 15; // Send 15 emails concurrently for better performance
const DAILY_LIMIT = 100; // Maximum emails per day
const HOURS_BETWEEN_SENDS = 2; // Send every 2 hours during business hours
const CAMPAIGN_ID = 1; // Default campaign ID to use

const resend = new Resend(RESEND_API_KEY);

// Initialize database connection
let sql;
if (DATABASE_URL) {
  sql = neon(DATABASE_URL);
} else {
  console.error('DATABASE_URL not found. Running in fallback mode.');
}

// Professional email template with Tree of Life branding
const EMAIL_TEMPLATE = {
  subject: "Protect Your Family's Financial Future - Emergency Wealth Plan",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #2e5c5a 0%, #1a3f3d 100%); color: white; padding: 30px 20px; text-align: center;">
        <img src="https://treeoflifeagencies.com/logo.png" alt="Tree of Life Agencies" style="max-height: 60px; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Emergency Wealth Plan</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Secure Your Family's Financial Future Today</p>
      </div>
      
      <!-- Main content -->
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #2e5c5a; margin: 0 0 20px 0; font-size: 24px;">Dear Friend,</h2>
        
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
        
        <!-- Benefits list -->
        <div style="background-color: #f8f9fa; border-left: 4px solid #f39c12; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0;">
          <h3 style="color: #2e5c5a; margin: 0 0 15px 0; font-size: 20px;">What You'll Discover:</h3>
          <ul style="color: #333; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>The #1 financial mistake that destroys family wealth</li>
            <li>Tax-free growth strategies most advisors won't tell you</li>
            <li>How to protect your income if you can't work</li>
            <li>The legacy trap that leaves families with debt, not wealth</li>
            <li>Simple steps to build generational wealth starting today</li>
          </ul>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
          Don't let these hidden threats steal your family's financial security. Take action today and secure the wealth plan that could change everything.
        </p>
        
        <!-- Contact info -->
        <div style="background-color: #2e5c5a; color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Questions? Call me directly:</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold;">📞 (334) 467-3090</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e5c5a;">Brandon Burke</p>
        <p style="margin: 0 0 5px 0; color: #666;">Financial Educator</p>
        <p style="margin: 0 0 15px 0; color: #666;"><strong>Tree of Life Agencies</strong></p>
        <p style="margin: 0 0 5px 0; color: #666;">Partnered with Guardian Life Insurance Company of America</p>
        <br><img src="https://treeoflifeagencies.com/assets/tree-of-life-guardian-logo.png" alt="Tree of Life Agencies - Guardian Life Co." style="max-width: 300px; height: auto; margin: 10px 0;" />
        <p style="margin: 0; font-size: 14px; color: #666;">
          📧 <a href="mailto:brandonb@treeoflifeagencies.com" style="color: #2e5c5a;">brandonb@treeoflifeagencies.com</a>
        </p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            To unsubscribe, <a href="https://treeoflifeagencies.com/unsubscribe?email={{email}}" style="color: #999;">click here</a>
          </p>
        </div>
      </div>
    </div>
  `
};

// Load sent emails tracking
function loadSentEmails() {
  try {
    if (fs.existsSync('sent_emails.json')) {
      const data = fs.readFileSync('sent_emails.json', 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Creating new sent emails tracking file...');
  }
  return { emails: [] };
}

// Save sent email record
function saveSentEmail(email, campaignName, status) {
  const sentData = loadSentEmails();
  sentData.emails.push({
    email,
    campaignName,
    status,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0]
  });
  fs.writeFileSync('sent_emails.json', JSON.stringify(sentData, null, 2));
}

// Load unsubscribes
function loadUnsubscribes() {
  try {
    if (fs.existsSync('unsubscribes.json')) {
      const data = fs.readFileSync('unsubscribes.json', 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No unsubscribe file found.');
  }
  return { unsubscribes: [] };
}

// Check if email is unsubscribed
function isUnsubscribed(email) {
  const unsubData = loadUnsubscribes();
  return unsubData.unsubscribes.some(u => 
    u.email.toLowerCase() === email.toLowerCase()
  );
}

// Check if email was already sent today
function wasEmailSentToday(email) {
  const sentData = loadSentEmails();
  const today = new Date().toISOString().split('T')[0];
  return sentData.emails.some(record => 
    record.email.toLowerCase() === email.toLowerCase() && 
    record.date === today &&
    record.status === 'sent'
  );
}

// Get today's sent count
function getTodaysSentCount() {
  const sentData = loadSentEmails();
  const today = new Date().toISOString().split('T')[0];
  return sentData.emails.filter(record => 
    record.date === today && record.status === 'sent'
  ).length;
}

// Load active campaign from database
async function loadActiveCampaign() {
  if (!sql) return null;
  
  try {
    const campaigns = await sql`
      SELECT * FROM email_campaigns 
      WHERE status = 'active' 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    
    if (campaigns.length > 0) {
      console.log(`📧 Using active campaign: "${campaigns[0].name}"`);
      return campaigns[0];
    }
    
    // Fallback to any campaign
    const allCampaigns = await sql`
      SELECT * FROM email_campaigns 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    
    if (allCampaigns.length > 0) {
      console.log(`📧 Using latest campaign: "${allCampaigns[0].name}"`);
      return allCampaigns[0];
    }
    
  } catch (error) {
    console.error('Error loading campaign:', error.message);
  }
  
  return null;
}

// Load email template from database
async function loadEmailTemplate() {
  if (!sql) return null;
  
  try {
    const templates = await sql`
      SELECT * FROM email_templates 
      WHERE active = true 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    
    if (templates.length > 0) {
      console.log(`📝 Using template: "${templates[0].name}"`);
      return templates[0];
    }
    
  } catch (error) {
    console.error('Error loading template:', error.message);
  }
  
  return null;
}

// Check if email was sent recently (within last 7 days)
async function wasEmailSentRecently(email, campaignId) {
  if (!sql) {
    // Fallback to file-based tracking
    return wasEmailSentToday(email);
  }
  
  try {
    const recentLogs = await sql`
      SELECT COUNT(*) as count FROM email_logs 
      WHERE "recipientEmail" = ${email} 
      AND "campaignId" = ${campaignId}
      AND "sentAt" > NOW() - INTERVAL '7 days'
      AND status = 'sent'
    `;
    
    return recentLogs[0].count > 0;
  } catch (error) {
    console.error('Error checking recent sends:', error.message);
    return false;
  }
}

// Check if email is unsubscribed in database
async function isEmailUnsubscribed(email) {
  if (!sql) {
    return isUnsubscribed(email);
  }
  
  try {
    const unsubscribed = await sql`
      SELECT COUNT(*) as count FROM unsubscribe_list 
      WHERE email = ${email.toLowerCase()}
    `;
    
    return unsubscribed[0].count > 0;
  } catch (error) {
    console.error('Error checking unsubscribe status:', error.message);
    return isUnsubscribed(email);
  }
}

// Load contacts from database with smart filtering
async function loadContacts() {
  if (sql) {
    try {
      const leads = await sql`
        SELECT l.*, 
               CASE WHEN ul.email IS NOT NULL THEN true ELSE false END as is_unsubscribed,
               CASE WHEN el."recipientEmail" IS NOT NULL THEN true ELSE false END as was_sent_recently
        FROM leads l
        LEFT JOIN unsubscribe_list ul ON l.email = ul.email
        LEFT JOIN (
          SELECT DISTINCT "recipientEmail" 
          FROM email_logs 
          WHERE "sentAt" > NOW() - INTERVAL '7 days'
          AND status = 'sent'
        ) el ON l.email = el."recipientEmail"
        WHERE l."isActive" = true
        ORDER BY l."createdAt" DESC
      `;
      
      const activeContacts = leads
        .filter(lead => !lead.is_unsubscribed && !lead.was_sent_recently)
        .map(lead => ({
          id: lead.id,
          email: lead.email,
          firstName: lead.firstName || 'Friend',
          lastName: lead.lastName || '',
          phone: lead.phone,
          company: lead.company,
          city: lead.city,
          state: lead.state,
          zipCode: lead.zipCode,
          source: 'database'
        }));
        
      console.log(`📊 Database status: ${leads.length} total, ${activeContacts.length} eligible for sending`);
      return activeContacts;
      
    } catch (error) {
      console.error('Database error, falling back to CSV:', error.message);
    }
  }
  
  // Fallback to CSV file
  const csvFiles = ['Brandon334-042925.csv', 'leads_miami_dade.csv', 'leads_broward.csv'];
  let contacts = [];
  
  for (const file of csvFiles) {
    if (fs.existsSync(file)) {
      try {
        const csvData = fs.readFileSync(file, 'utf8');
        const lines = csvData.split('\n').slice(1); // Skip header
        
        for (const line of lines) {
          const [firstName, lastName, email] = line.split(',').map(s => s.trim().replace(/"/g, ''));
          if (email && email.includes('@')) {
            contacts.push({ email, firstName: firstName || 'Friend', lastName: lastName || '', source: file });
          }
        }
        console.log(`📁 Loaded ${contacts.length} contacts from ${file}`);
        break;
      } catch (error) {
        console.log(`Could not read ${file}:`, error.message);
      }
    }
  }
  
  return contacts;
}

// Send email batch using database campaign and template
async function sendEmailBatch(contacts, campaign, template, batchSize = BATCH_SIZE) {
  const results = {
    sent: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  // Use campaign or template content
  const emailSubject = campaign?.subject || template?.subject || EMAIL_TEMPLATE.subject;
  const emailContent = campaign?.htmlContent || template?.content || EMAIL_TEMPLATE.html;
  const fromEmail = campaign?.fromEmail || 'Brandon Burke <brandonb@treeoflifeagencies.com>';
  const campaignId = campaign?.id || CAMPAIGN_ID;
  
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    
    const promises = batch.map(async (contact) => {
      try {
        // Check limits and exclusions
        if (await isEmailUnsubscribed(contact.email)) {
          results.skipped++;
          results.details.push(`${contact.email} - Unsubscribed`);
          saveSentEmail(contact.email, 'persistent-campaign', 'skipped-unsubscribed');
          return;
        }
        
        if (await wasEmailSentRecently(contact.email, campaignId)) {
          results.skipped++;
          results.details.push(`${contact.email} - Already sent recently`);
          return;
        }
        
        if (getTodaysSentCount() >= DAILY_LIMIT) {
          results.details.push(`Daily limit reached (${DAILY_LIMIT})`);
          return;
        }
        
        // Personalize email content
        let personalizedHtml = emailContent
          .replace(/{{email}}/g, contact.email)
          .replace(/{{firstName}}/g, contact.firstName)
          .replace(/{{lastName}}/g, contact.lastName)
          .replace(/{{fullName}}/g, `${contact.firstName} ${contact.lastName}`.trim())
          .replace(/Dear Friend,/g, `Dear ${contact.firstName},`)
          .replace(/Hello,/g, `Hello ${contact.firstName},`);
          
        // Add unsubscribe link if not already present
        if (!personalizedHtml.includes('unsubscribe')) {
          personalizedHtml = personalizedHtml.replace(
            /<\/body>/i,
            `
            <div style="background-color: #2c5530; color: white; padding: 20px; text-align: center; font-size: 12px; margin-top: 20px;">
              <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
                <p style="margin: 0; color: #b8e6b8; font-size: 11px;">
                  If you no longer wish to receive these emails, you can 
                  <a href="https://treeoflifeagencies.com/unsubscribe?email=${encodeURIComponent(contact.email)}" 
                     style="color: #b8e6b8; text-decoration: underline;">unsubscribe here</a>
                </p>
              </div>
            </div>
            </body>`
          );
        }
          
        let personalizedSubject = emailSubject
          .replace(/{{firstName}}/g, contact.firstName)
          .replace(/{{lastName}}/g, contact.lastName);
        
        // Send email
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [contact.email],
          subject: personalizedSubject,
          html: personalizedHtml,
        });
        
        if (error) {
          results.errors++;
          results.details.push(`${contact.email} - Error: ${error.message}`);
          saveSentEmail(contact.email, 'persistent-campaign', 'error');
        } else {
          results.sent++;
          results.details.push(`${contact.email} - Sent successfully`);
          saveSentEmail(contact.email, 'persistent-campaign', 'sent');
          
          // Log to database
          if (sql) {
            try {
              await sql`
                INSERT INTO email_logs (
                  "campaignId", 
                  "recipientEmail", 
                  "recipientName",
                  "subject", 
                  "htmlContent",
                  "status", 
                  "sentAt",
                  "resendId"
                )
                VALUES (
                  ${campaignId}, 
                  ${contact.email}, 
                  ${`${contact.firstName} ${contact.lastName}`.trim()},
                  ${personalizedSubject}, 
                  ${personalizedHtml},
                  'sent', 
                  ${new Date().toISOString()},
                  ${data?.id || 'persistent-' + Date.now()}
                )
              `;
            } catch (dbError) {
              console.log('Database logging failed:', dbError.message);
            }
          }
        }
        
        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        results.errors++;
        results.details.push(`${contact.email} - Exception: ${error.message}`);
        saveSentEmail(contact.email, 'persistent-campaign', 'error');
      }
    });
    
    await Promise.all(promises);
    
    // Break if we hit daily limit
    if (getTodaysSentCount() >= DAILY_LIMIT) {
      break;
    }
    
    // Delay between batches
    if (i + batchSize < contacts.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return results;
}

// Main campaign runner - integrates with your database
async function runCampaign() {
  console.log('\n🚀 Starting Tree of Life Email Campaign');
  console.log('⏰', new Date().toLocaleString());
  
  try {
    // Load campaign and template from database
    const [campaign, template, contacts] = await Promise.all([
      loadActiveCampaign(),
      loadEmailTemplate(),
      loadContacts()
    ]);
    
    if (contacts.length === 0) {
      console.log('❌ No eligible contacts found');
      return;
    }
    
    console.log(`📧 Loaded ${contacts.length} eligible contacts`);
    
    if (campaign) {
      console.log(`📋 Campaign: "${campaign.name}" (ID: ${campaign.id})`);
    }
    
    if (template) {
      console.log(`📝 Template: "${template.name}"`);
    }
    
    // Check today's quota
    const todaysSent = getTodaysSentCount();
    const remaining = Math.max(0, DAILY_LIMIT - todaysSent);
    
    console.log(`📊 Today's Status:`);
    console.log(`   - Already sent: ${todaysSent}/${DAILY_LIMIT}`);
    console.log(`   - Eligible contacts: ${contacts.length}`);
    console.log(`   - Can send: ${Math.min(remaining, contacts.length)}`);
    
    if (remaining === 0) {
      console.log('✅ Daily limit reached. Campaign complete for today.');
      return;
    }
    
    if (contacts.length === 0) {
      console.log('✅ All contacts processed recently.');
      return;
    }
    
    // Send to contacts up to daily limit
    const contactsToSend = contacts.slice(0, remaining);
    console.log(`\n📤 Sending to ${contactsToSend.length} recipients...`);
    
    const results = await sendEmailBatch(contactsToSend, campaign, template);
    
    console.log('\n📈 Campaign Results:');
    console.log(`   ✅ Sent: ${results.sent}`);
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    console.log(`   📊 New total today: ${getTodaysSentCount()}/${DAILY_LIMIT}`);
    
    // Update campaign status in database
    if (sql && campaign && results.sent > 0) {
      try {
        await sql`
          UPDATE email_campaigns 
          SET "updatedAt" = ${new Date().toISOString()}
          WHERE id = ${campaign.id}
        `;
      } catch (error) {
        console.log('Failed to update campaign timestamp:', error.message);
      }
    }
    
    // Show some details
    if (results.details.length > 0) {
      console.log('\n📝 Recent activity:');
      results.details.slice(-5).forEach(detail => console.log(`   ${detail}`));
    }
    
  } catch (error) {
    console.error('❌ Campaign error:', error);
  }
}

// Schedule next run
function scheduleNextRun() {
  const now = new Date();
  const hour = now.getHours();
  
  // Only run during business hours (9 AM - 6 PM EST)
  if (hour >= 9 && hour <= 18) {
    console.log(`\n⏰ Next run scheduled in ${HOURS_BETWEEN_SENDS} hour(s)`);
    setTimeout(() => {
      runCampaign().then(() => scheduleNextRun());
    }, HOURS_BETWEEN_SENDS * 60 * 60 * 1000);
  } else {
    // Schedule for 9 AM tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    console.log(`\n😴 Outside business hours. Next run at 9 AM (in ${Math.round(msUntilTomorrow / 1000 / 60 / 60)} hours)`);
    setTimeout(() => {
      runCampaign().then(() => scheduleNextRun());
    }, msUntilTomorrow);
  }
}

// Handle different execution modes
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'once') {
    // Run once and exit
    runCampaign().then(() => {
      console.log('\n✅ Single run complete');
      process.exit(0);
    });
  } else if (command === 'status') {
    // Show status
    const todaysSent = getTodaysSentCount();
    console.log(`📊 Campaign Status:`);
    console.log(`   Today: ${todaysSent}/${DAILY_LIMIT} emails sent`);
    console.log(`   Remaining: ${DAILY_LIMIT - todaysSent}`);
  } else {
    // Default: run continuously
    console.log('🔄 Starting persistent email campaign system...');
    console.log('📋 Configuration:');
    console.log(`   • Daily limit: ${DAILY_LIMIT} emails`);
    console.log(`   • Batch size: ${BATCH_SIZE} concurrent`);
    console.log(`   • Send interval: Every ${HOURS_BETWEEN_SENDS} hour(s)`);
    console.log(`   • Business hours: 9 AM - 6 PM EST`);
    
    runCampaign().then(() => scheduleNextRun());
  }
}

export { runCampaign, sendEmailBatch, loadContacts };