import { users, leads, emailCampaigns, emailLogs, emailResponses, scheduledCampaigns, emailTemplates, unsubscribes, emailSequences, sequenceSteps, sequenceSubscribers, type User, type InsertUser, type Lead, type InsertLead, type EmailCampaign, type EmailLog, type EmailResponse, type ScheduledCampaign, type InsertEmailCampaign, type InsertEmailLog, type InsertEmailResponse, type InsertScheduledCampaign, type EmailTemplate, type InsertEmailTemplate, type Unsubscribe, type InsertUnsubscribe, type EmailSequence, type InsertEmailSequence, type SequenceStep, type InsertSequenceStep, type SequenceSubscriber, type InsertSequenceSubscriber } from "./schema";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and, inArray, sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql_client = neon(process.env.DATABASE_URL);
const db = drizzle(sql_client);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  getAllLeads(): Promise<Lead[]>;
  deleteLead(id: number): Promise<void>;
  bulkDeleteLeads(ids: number[]): Promise<number>;
  getLeadsPaginated(page: number, limit: number): Promise<{ leads: Lead[], total: number, hasMore: boolean }>;
  
  // Email campaign methods
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  getAllEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  updateEmailCampaignStatus(id: number, status: string): Promise<void>;
  
  // Email log methods
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByCampaign(campaignId: number): Promise<EmailLog[]>;
  getAllEmailLogs(): Promise<EmailLog[]>;
  updateEmailLogStatus(id: number, status: string): Promise<void>;
  
  // Email response methods
  createEmailResponse(response: InsertEmailResponse): Promise<EmailResponse>;
  getEmailResponsesByLog(emailLogId: number): Promise<EmailResponse[]>;
  getAllEmailResponses(): Promise<EmailResponse[]>;
  markResponseAsRead(id: number): Promise<void>;
  
  // Scheduled campaign methods
  createScheduledCampaign(scheduledCampaign: InsertScheduledCampaign): Promise<ScheduledCampaign>;
  getAllScheduledCampaigns(): Promise<ScheduledCampaign[]>;
  getScheduledCampaign(id: number): Promise<ScheduledCampaign | undefined>;
  updateScheduledCampaign(id: number, updates: Partial<ScheduledCampaign>): Promise<ScheduledCampaign>;
  deleteScheduledCampaign(id: number): Promise<void>;
  
  // Email template methods
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: number): Promise<void>;
  
  // Unsubscribe methods
  addToUnsubscribeList(unsubscribe: InsertUnsubscribe): Promise<Unsubscribe>;
  getAllUnsubscribes(): Promise<Unsubscribe[]>;
  isUnsubscribed(email: string): Promise<boolean>;
  removeFromUnsubscribeList(email: string): Promise<void>;
  
  // Email sequence methods
  createEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence>;
  getAllEmailSequences(): Promise<EmailSequence[]>;
  getEmailSequence(id: number): Promise<EmailSequence | undefined>;
  updateEmailSequence(id: number, updates: Partial<InsertEmailSequence>): Promise<EmailSequence>;
  deleteEmailSequence(id: number): Promise<void>;
  
  // Sequence step methods
  createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep>;
  getSequenceSteps(sequenceId: number): Promise<SequenceStep[]>;
  updateSequenceStep(id: number, updates: Partial<InsertSequenceStep>): Promise<SequenceStep>;
  deleteSequenceStep(id: number): Promise<void>;
  
  // Sequence subscriber methods
  addToSequence(subscriber: InsertSequenceSubscriber): Promise<SequenceSubscriber>;
  getSequenceSubscribers(sequenceId: number): Promise<SequenceSubscriber[]>;
  updateSubscriberStatus(id: number, status: string, currentStep?: number): Promise<SequenceSubscriber>;
  completeSequenceForSubscriber(id: number): Promise<void>;
  getPendingSequenceEmails(): Promise<SequenceSubscriber[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values(lead).returning();
    return result[0];
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.isActive, true)).orderBy(desc(leads.createdAt));
  }

  async deleteLead(id: number): Promise<void> {
    await db.update(leads).set({ isActive: false }).where(eq(leads.id, id));
  }

  async bulkDeleteLeads(ids: number[]): Promise<number> {
    const result = await db.update(leads)
      .set({ isActive: false })
      .where(inArray(leads.id, ids));
    
    return result.rowCount || 0;
  }

  async getLeadsPaginated(page: number, limit: number): Promise<{ leads: Lead[], total: number, hasMore: boolean }> {
    const offset = (page - 1) * limit;
    
    const [leadsResult, countResult] = await Promise.all([
      db.select().from(leads)
        .where(eq(leads.isActive, true))
        .orderBy(desc(leads.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.isActive, true))
    ]);

    const total = countResult[0]?.count || 0;
    const hasMore = offset + limit < total;

    return {
      leads: leadsResult,
      total,
      hasMore
    };
  }

  // Email campaign methods
  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const result = await db.insert(emailCampaigns).values(campaign).returning();
    return result[0];
  }

  async getAllEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    const result = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return result[0];
  }

  async updateEmailCampaignStatus(id: number, status: string): Promise<void> {
    await db.update(emailCampaigns)
      .set({ status, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id));
  }

  // Email log methods
  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const result = await db.insert(emailLogs).values(log).returning();
    return result[0];
  }

  async getEmailLogsByCampaign(campaignId: number): Promise<EmailLog[]> {
    return await db.select().from(emailLogs)
      .where(eq(emailLogs.campaignId, campaignId))
      .orderBy(desc(emailLogs.sentAt));
  }

  async getAllEmailLogs(): Promise<EmailLog[]> {
    return await db.select().from(emailLogs).orderBy(desc(emailLogs.sentAt));
  }

  async updateEmailLogStatus(id: number, status: string): Promise<void> {
    await db.update(emailLogs).set({ status }).where(eq(emailLogs.id, id));
  }

  // Email response methods
  async createEmailResponse(response: InsertEmailResponse): Promise<EmailResponse> {
    const result = await db.insert(emailResponses).values(response).returning();
    return result[0];
  }

  async getEmailResponsesByLog(emailLogId: number): Promise<EmailResponse[]> {
    return await db.select().from(emailResponses)
      .where(eq(emailResponses.emailLogId, emailLogId))
      .orderBy(desc(emailResponses.receivedAt));
  }

  async getAllEmailResponses(): Promise<EmailResponse[]> {
    return await db.select().from(emailResponses).orderBy(desc(emailResponses.receivedAt));
  }

  async markResponseAsRead(id: number): Promise<void> {
    await db.update(emailResponses).set({ isRead: true }).where(eq(emailResponses.id, id));
  }

  // Scheduled campaign methods
  async createScheduledCampaign(scheduledCampaign: InsertScheduledCampaign): Promise<ScheduledCampaign> {
    const result = await db.insert(scheduledCampaigns).values(scheduledCampaign).returning();
    return result[0];
  }

  async getAllScheduledCampaigns(): Promise<ScheduledCampaign[]> {
    return await db.select().from(scheduledCampaigns).orderBy(desc(scheduledCampaigns.createdAt));
  }

  async getScheduledCampaign(id: number): Promise<ScheduledCampaign | undefined> {
    const result = await db.select().from(scheduledCampaigns).where(eq(scheduledCampaigns.id, id));
    return result[0];
  }

  async updateScheduledCampaign(id: number, updates: Partial<ScheduledCampaign>): Promise<ScheduledCampaign> {
    const result = await db.update(scheduledCampaigns)
      .set(updates)
      .where(eq(scheduledCampaigns.id, id))
      .returning();
    return result[0];
  }

  async deleteScheduledCampaign(id: number): Promise<void> {
    await db.delete(scheduledCampaigns).where(eq(scheduledCampaigns.id, id));
  }

  // Email template methods
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values(template).returning();
    return result[0];
  }

  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return result[0];
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const result = await db.update(emailTemplates)
      .set(template)
      .where(eq(emailTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // Unsubscribe methods
  async addToUnsubscribeList(unsubscribe: InsertUnsubscribe): Promise<Unsubscribe> {
    const result = await db.insert(unsubscribes).values(unsubscribe).returning();
    return result[0];
  }

  async getAllUnsubscribes(): Promise<Unsubscribe[]> {
    return await db.select().from(unsubscribes).orderBy(desc(unsubscribes.unsubscribedAt));
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    const result = await db.select().from(unsubscribes).where(eq(unsubscribes.email, email));
    return result.length > 0;
  }

  async removeFromUnsubscribeList(email: string): Promise<void> {
    await db.delete(unsubscribes).where(eq(unsubscribes.email, email));
  }

  // Email sequence methods
  async createEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence> {
    const result = await db.insert(emailSequences).values(sequence).returning();
    return result[0];
  }

  async getAllEmailSequences(): Promise<EmailSequence[]> {
    return await db.select().from(emailSequences).orderBy(desc(emailSequences.createdAt));
  }

  async getEmailSequence(id: number): Promise<EmailSequence | undefined> {
    const result = await db.select().from(emailSequences).where(eq(emailSequences.id, id));
    return result[0];
  }

  async updateEmailSequence(id: number, updates: Partial<InsertEmailSequence>): Promise<EmailSequence> {
    const result = await db.update(emailSequences)
      .set(updates)
      .where(eq(emailSequences.id, id))
      .returning();
    return result[0];
  }

  async deleteEmailSequence(id: number): Promise<void> {
    await db.delete(emailSequences).where(eq(emailSequences.id, id));
  }

  // Sequence step methods
  async createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep> {
    const result = await db.insert(sequenceSteps).values(step).returning();
    return result[0];
  }

  async getSequenceSteps(sequenceId: number): Promise<SequenceStep[]> {
    return await db.select().from(sequenceSteps)
      .where(and(eq(sequenceSteps.sequenceId, sequenceId), eq(sequenceSteps.isActive, true)))
      .orderBy(sequenceSteps.stepNumber);
  }

  async updateSequenceStep(id: number, updates: Partial<InsertSequenceStep>): Promise<SequenceStep> {
    const result = await db.update(sequenceSteps)
      .set(updates)
      .where(eq(sequenceSteps.id, id))
      .returning();
    return result[0];
  }

  async deleteSequenceStep(id: number): Promise<void> {
    await db.update(sequenceSteps).set({ isActive: false }).where(eq(sequenceSteps.id, id));
  }

  // Sequence subscriber methods
  async addToSequence(subscriber: InsertSequenceSubscriber): Promise<SequenceSubscriber> {
    const result = await db.insert(sequenceSubscribers).values(subscriber).returning();
    return result[0];
  }

  async getSequenceSubscribers(sequenceId: number): Promise<SequenceSubscriber[]> {
    return await db.select().from(sequenceSubscribers)
      .where(eq(sequenceSubscribers.sequenceId, sequenceId))
      .orderBy(desc(sequenceSubscribers.startedAt));
  }

  async updateSubscriberStatus(id: number, status: string, currentStep?: number): Promise<SequenceSubscriber> {
    const updates: any = { status };
    if (currentStep !== undefined) {
      updates.currentStep = currentStep;
    }
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    const result = await db.update(sequenceSubscribers)
      .set(updates)
      .where(eq(sequenceSubscribers.id, id))
      .returning();
    return result[0];
  }

  async completeSequenceForSubscriber(id: number): Promise<void> {
    await db.update(sequenceSubscribers)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(sequenceSubscribers.id, id));
  }

  async getPendingSequenceEmails(): Promise<SequenceSubscriber[]> {
    const now = new Date();
    return await db.select().from(sequenceSubscribers)
      .where(
        and(
          eq(sequenceSubscribers.status, 'active'),
          sql`${sequenceSubscribers.nextEmailDue} <= ${now}`
        )
      )
      .orderBy(sequenceSubscribers.nextEmailDue);
  }
}

const storage = new DatabaseStorage();
export default storage;