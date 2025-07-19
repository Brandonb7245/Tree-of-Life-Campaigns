const fs = require('fs');
const { Resend } = require('resend');
const { neon } = require('@neondatabase/serverless');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

class SequenceAutomation {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.emailsSentToday = 0;
    this.dailyLimit = 100; // Maximum emails per day
  }

  async start() {
    console.log('🚀 Starting Email Sequence Automation...');
    this.isRunning = true;
    
    // Run immediately
    await this.processPendingEmails();
    
    // Then run every 15 minutes
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
      this.intervalId = null;
    }
    console.log('✅ Sequence automation stopped');
  }

  async processPendingEmails() {
    if (!this.isRunning) return;

    try {
      console.log('🔍 Checking for pending sequence emails...');
      
      // Check if we're within business hours (9 AM - 6 PM EST)
      const now = new Date();
      const estHour = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"})).getHours();
      
      if (estHour < 9 || estHour >= 18) {
        console.log(`⏰ Outside business hours (${estHour}:00 EST). Waiting until 9 AM - 6 PM EST.`);
        return;
      }

      // Reset daily counter at midnight EST
      const estDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"})).toDateString();
      const lastResetDate = this.lastResetDate || '';
      
      if (estDate !== lastResetDate) {
        this.emailsSentToday = 0;
        this.lastResetDate = estDate;
        console.log('📅 Daily email counter reset');
      }

      // Check daily limit
      if (this.emailsSentToday >= this.dailyLimit) {
        console.log(`📊 Daily limit reached (${this.emailsSentToday}/${this.dailyLimit}). Waiting until tomorrow.`);
        return;
      }

      // Get pending sequence emails
      const pendingEmails = await this.getPendingSequenceEmails();
      
      if (pendingEmails.length === 0) {
        console.log('✅ No pending sequence emails found');
        return;
      }

      console.log(`📧 Found ${pendingEmails.length} pending sequence emails`);

      // Process up to remaining daily limit
      const remainingLimit = this.dailyLimit - this.emailsSentToday;
      const emailsToProcess = pendingEmails.slice(0, remainingLimit);

      for (const subscriber of emailsToProcess) {
        try {
          await this.sendSequenceEmail(subscriber);
          this.emailsSentToday++;
          
          // Add small delay between emails
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Failed to send sequence email for subscriber ${subscriber.id}:`, error);
        }
      }

      console.log(`✅ Processed ${emailsToProcess.length} sequence emails. Daily total: ${this.emailsSentToday}/${this.dailyLimit}`);

    } catch (error) {
      console.error('❌ Error processing pending sequence emails:', error);
    }
  }

  async getPendingSequenceEmails() {
    const now = new Date().toISOString();
    
    const query = `
      SELECT 
        ss.*,
        es.name as sequence_name,
        l.first_name,
        l.last_name,
        l.email,
        steps.subject,
        steps.html_content,
        steps.delay_days
      FROM sequence_subscribers ss
      JOIN email_sequences es ON ss.sequence_id = es.id
      JOIN leads l ON ss.lead_id = l.id
      JOIN sequence_steps steps ON ss.sequence_id = steps.sequence_id AND ss.current_step = steps.step_number
      WHERE ss.status = 'active'
        AND ss.next_email_at <= $1
        AND es.is_active = true
        AND steps.is_active = true
      ORDER BY ss.next_email_at ASC
    `;
    
    const result = await sql(query, [now]);
    return result;
  }

  async sendSequenceEmail(subscriber) {
    try {
      // Check if email is unsubscribed
      const unsubscribeCheck = await sql(
        'SELECT email FROM unsubscribe_list WHERE email = $1',
        [subscriber.email]
      );
      
      if (unsubscribeCheck.length > 0) {
        console.log(`🚫 Skipping unsubscribed email: ${subscriber.email}`);
        await this.updateSubscriberStatus(subscriber.id, 'unsubscribed');
        return;
      }

      // Add unsubscribe link to email content if not already present
      let emailContent = subscriber.html_content;
      if (!emailContent.includes('unsubscribe')) {
        emailContent = emailContent.replace(
          /<\/body>/i,
          `
          <div style="background-color: #2c5530; color: white; padding: 20px; text-align: center; font-size: 12px; margin-top: 20px;">
            <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
              <p style="margin: 0; color: #b8e6b8; font-size: 11px;">
                If you no longer wish to receive these emails, you can 
                <a href="https://treeoflifeagencies.com/unsubscribe?email=${encodeURIComponent(subscriber.email)}" 
                   style="color: #b8e6b8; text-decoration: underline;">unsubscribe here</a>
              </p>
            </div>
          </div>
          </body>`
        );
      }

      // Send email via Resend
      const emailResult = await resend.emails.send({
        from: 'Tree of Life Agencies <brandonb@treeoflifeagencies.com>',
        to: subscriber.email,
        subject: subscriber.subject,
        html: emailContent
      });

      if (emailResult.error) {
        throw new Error(emailResult.error.message);
      }

      console.log(`✅ Sent sequence email to ${subscriber.email} (Step ${subscriber.current_step})`);

      // Log the email
      await sql(`
        INSERT INTO email_logs (
          campaign_id, recipient_email, recipient_name, subject, 
          html_content, resend_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        null, // No campaign ID for sequence emails
        subscriber.email,
        `${subscriber.first_name} ${subscriber.last_name || ''}`.trim(),
        subscriber.subject,
        subscriber.html_content,
        emailResult.data?.id || 'sequence-email',
        'sent'
      ]);

      // Update subscriber to next step or complete
      await this.advanceSubscriber(subscriber);

    } catch (error) {
      console.error(`❌ Failed to send sequence email to ${subscriber.email}:`, error);
      throw error;
    }
  }

  async advanceSubscriber(subscriber) {
    const nextStep = subscriber.current_step + 1;
    
    // Get next step details
    const nextStepQuery = `
      SELECT * FROM sequence_steps 
      WHERE sequence_id = $1 AND step_number = $2 AND is_active = true
    `;
    
    const nextSteps = await sql(nextStepQuery, [subscriber.sequence_id, nextStep]);
    
    if (nextSteps.length > 0) {
      // Calculate next email time
      const nextEmailAt = new Date();
      nextEmailAt.setDate(nextEmailAt.getDate() + nextSteps[0].delay_days);
      
      // Update subscriber to next step
      await sql(`
        UPDATE sequence_subscribers 
        SET current_step = $1, 
            next_email_at = $2, 
            last_email_sent_at = NOW()
        WHERE id = $3
      `, [nextStep, nextEmailAt.toISOString(), subscriber.id]);
      
      console.log(`📅 Advanced subscriber ${subscriber.id} to step ${nextStep}, next email: ${nextEmailAt.toISOString()}`);
    } else {
      // Sequence completed
      await this.updateSubscriberStatus(subscriber.id, 'completed');
      console.log(`🎉 Completed sequence for subscriber ${subscriber.id}`);
    }
  }

  async updateSubscriberStatus(subscriberId, status) {
    const updates = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [subscriberId, ...Object.values(updates)];
    
    await sql(`UPDATE sequence_subscribers SET ${setClause} WHERE id = $1`, values);
  }

  async getStats() {
    const stats = await sql(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_sequences,
        COUNT(*) FILTER (WHERE next_email_at <= NOW() AND status = 'active') as pending_emails
      FROM sequence_subscribers
    `);
    
    return {
      activeSubscribers: parseInt(stats[0]?.active_subscribers || 0),
      completedSequences: parseInt(stats[0]?.completed_sequences || 0),
      pendingEmails: parseInt(stats[0]?.pending_emails || 0),
      emailsSentToday: this.emailsSentToday,
      dailyLimit: this.dailyLimit
    };
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT, shutting down gracefully...');
  if (automation) {
    await automation.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
  if (automation) {
    await automation.stop();
  }
  process.exit(0);
});

// Start automation if run directly
if (require.main === module) {
  const automation = new SequenceAutomation();
  
  automation.start().catch(error => {
    console.error('❌ Failed to start sequence automation:', error);
    process.exit(1);
  });

  // Log stats every hour
  setInterval(async () => {
    try {
      const stats = await automation.getStats();
      console.log(`📊 Sequence Stats: ${stats.activeSubscribers} active, ${stats.completedSequences} completed, ${stats.pendingEmails} pending, ${stats.emailsSentToday}/${stats.dailyLimit} sent today`);
    } catch (error) {
      console.error('❌ Error getting stats:', error);
    }
  }, 60 * 60 * 1000); // Every hour
}

module.exports = SequenceAutomation;