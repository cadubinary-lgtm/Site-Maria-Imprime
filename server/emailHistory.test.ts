import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, addEmailToHistory, getEmailHistory, getEmailHistoryByOrderItem } from './db';

describe('Email History Functions', () => {
  let db: any;
  let testOrderId = 0;
  let testOrderItemId = 0;
  let emailId = 0;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available for tests');
    }
  });

  it('should add an email to history', async () => {
    const result = await addEmailToHistory({
      orderId: 999,
      orderItemId: 888,
      recipientEmail: 'test@example.com',
      recipientName: 'Test User',
      emailType: 'art_resend_request',
      subject: 'Test Email Subject',
      templateName: 'testTemplate',
      operatorNote: 'This is a test note',
      status: 'sent',
    });

    expect(result).toBeDefined();
    emailId = (result as any)?.insertId || 0;
  });

  it('should retrieve email history by order ID', async () => {
    const emails = await getEmailHistory(999);
    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBeGreaterThan(0);
    
    const testEmail = emails.find((e: any) => e.recipientEmail === 'test@example.com');
    expect(testEmail).toBeDefined();
    expect(testEmail?.emailType).toBe('art_resend_request');
    expect(testEmail?.status).toBe('sent');
  });

  it('should retrieve email history by order item ID', async () => {
    const emails = await getEmailHistoryByOrderItem(888);
    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBeGreaterThan(0);
    
    const testEmail = emails.find((e: any) => e.recipientEmail === 'test@example.com');
    expect(testEmail).toBeDefined();
    expect(testEmail?.emailType).toBe('art_resend_request');
  });

  it('should handle email with proof image URL', async () => {
    const result = await addEmailToHistory({
      orderId: 999,
      orderItemId: 888,
      recipientEmail: 'test2@example.com',
      recipientName: 'Test User 2',
      emailType: 'proof_for_approval',
      subject: 'Proof for Approval',
      templateName: 'proofTemplate',
      operatorNote: 'Please review this proof',
      proofImageUrl: 'https://example.com/proof.jpg',
      status: 'sent',
    });

    expect(result).toBeDefined();

    const emails = await getEmailHistory(999);
    const proofEmail = emails.find((e: any) => e.emailType === 'proof_for_approval');
    expect(proofEmail).toBeDefined();
    expect(proofEmail?.proofImageUrl).toBe('https://example.com/proof.jpg');
  });

  it('should handle failed email status', async () => {
    const result = await addEmailToHistory({
      orderId: 999,
      orderItemId: 888,
      recipientEmail: 'invalid@example.com',
      recipientName: 'Invalid User',
      emailType: 'order_confirmation',
      subject: 'Order Confirmation',
      status: 'failed',
      errorMessage: 'SMTP connection failed',
    });

    expect(result).toBeDefined();

    const emails = await getEmailHistory(999);
    const failedEmail = emails.find((e: any) => e.status === 'failed');
    expect(failedEmail).toBeDefined();
    expect(failedEmail?.errorMessage).toBe('SMTP connection failed');
  });

  it('should return empty array for non-existent order', async () => {
    const emails = await getEmailHistory(99999);
    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBe(0);
  });

  it('should return empty array for non-existent order item', async () => {
    const emails = await getEmailHistoryByOrderItem(99999);
    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBe(0);
  });
});
