// const Imap = require('imap');
import Imap from 'imap';
// const { simpleParser } = require('mailparser');
// import { simpleParser } from 'mailparser';
// const { Email, EmailCheck } = require('../models');
// const axios = require('axios');
// import axios from 'axios';
import  dotenv  from 'dotenv';
dotenv.config();
// require('dotenv').config();

export class ImapMonitorService {
  constructor() {
    if (!process.env.IMAP_USER || !process.env.IMAP_PASS) {
      console.warn('⚠️  IMAP credentials not configured. Email monitoring disabled.');
      this.enabled = false;
      return;
    }

    this.enabled = true;
    this.imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
    this.checkIMAPInterval = parseInt(process.env.IMAP_CHECK_INTERVAL) || 120000; // Default 2 minutes

    this.isConnected = false;
    this.checkInterval = null;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.enabled) return;

    this.imap.once('ready', () => {
      console.log('✅ IMAP connection established');
      this.isConnected = true;
      this.openInbox();
    });

    this.imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err.message);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      console.log('📧 IMAP connection ended');
      this.isConnected = false;
    });
  }

  async start() {
    if (!this.enabled) {
      console.log('⚠️  IMAP monitoring is disabled (missing credentials)');
      return;
    }

    try {
      this.imap.connect();
      
      // Start periodic checking (set in .env, default 2 minutes)
      this.checkInterval = setInterval(async () => {
        if (this.isConnected) {
          await this.checkForNewEmails();
        }
      }, this.checkIMAPInterval);

      console.log('📧 IMAP email monitoring started');
    } catch (error) {
      console.error('Failed to start IMAP monitoring:', error);
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.isConnected) {
      this.imap.end();
    }
  }

  openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('Error opening inbox:', err);
        return;
      }
      console.log(`📬 Inbox opened. Total messages: ${box.messages.total}`);
      this.checkForNewEmails();
    });
  }

  async checkForNewEmails() {
    if (!this.isConnected) return;

    try {
      // Get last check time from database
      const lastCheck = await EmailCheck.findOne({
        order: [['lastCheckTime', 'DESC']]
      });

      const sinceDate = lastCheck
        ? new Date(lastCheck.lastCheckTime)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours if no previous check

      // Search for emails since last check
      const searchCriteria = [['SINCE', sinceDate]];

      this.imap.search(searchCriteria, async (err, results) => {
        if (err) {
          console.error('Error searching for emails:', err);
          return;
        }

        if (!results || results.length === 0) {
          console.log('📭 No new emails found');
          return;
        }

        console.log(`📬 Found ${results.length} email(s) since ${sinceDate.toISOString()}`);
        await this.fetchAndProcessEmails(results);

        // Update last check time
        await EmailCheck.create({
          lastCheckTime: new Date(),
          emailsProcessed: results.length
        });
      });
    } catch (error) {
      console.error('Error checking for new emails:', error);
    }
  }

  async fetchAndProcessEmails(uids) {
    const fetch = this.imap.fetch(uids, {
      bodies: '',
      markSeen: false // Don't mark as seen immediately
    });

    fetch.on('message', (msg, _seqno) => {
      let buffer = '';

      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            await this.processEmail(parsed);
          } catch (error) {
            console.error('Error parsing email:', error);
          }
        });
      });

      msg.once('error', (err) => {
        console.error('Error fetching message:', err);
      });
    });

    fetch.once('error', (err) => {
      console.error('Fetch error:', err);
    });

    fetch.once('end', () => {
      console.log('✅ Finished fetching emails');
    });
  }

  async processEmail(parsed) {
    try {
      // Check if email already exists
      const existingEmail = await Email.findOne({
        where: { messageId: parsed.messageId }
      });

      if (existingEmail) {
        console.log(`Email already processed: ${parsed.messageId}`);
        return;
      }

      // Extract thread information
      const inReplyToId = parsed.inReplyTo;
      const threadId = parsed.references ? parsed.references.split(' ')[0] : parsed.messageId;

      let parentEmailId = null;
      if (inReplyToId) {
        const parentEmail = await Email.findOne({
          where: { messageId: inReplyToId }
        });
        if (parentEmail) {
          parentEmailId = parentEmail.id;
        }
      }

      // Create email record
      const email = await Email.create({
        messageId: parsed.messageId,
        inReplyTo: parentEmailId,
        threadId,
        subject: parsed.subject || '(No Subject)',
        from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'unknown',
        to: this.extractAddresses(parsed.to),
        cc: this.extractAddresses(parsed.cc),
        body: parsed.text,
        htmlBody: parsed.html,
        direction: 'inbound',
        receivedAt: parsed.date || new Date(),
        hasAttachments: (parsed.attachments && parsed.attachments.length > 0) || false,
        isProcessed: false,
        metadata: {
          headers: this.extractHeaders(parsed.headers),
          references: parsed.references
        }
      });

      console.log(`✅ Email saved: ${email.subject} from ${email.from}`);

      // Send webhook to mail server if configured
      if (process.env.MAIL_SERVER_WEBHOOK_URL) {
        try {
          await axios.post(process.env.MAIL_SERVER_WEBHOOK_URL, {
            secret: process.env.MAIL_SERVER_SECRET,
            email: {
              id: email.id,
              messageId: email.messageId,
              subject: email.subject,
              from: email.from,
              to: email.to,
              body: email.body,
              receivedAt: email.receivedAt
            }
          });
        } catch (webhookError) {
          console.error('Webhook notification failed:', webhookError.message);
        }
      }

      // Auto-create RFP if email looks like an RFP request
      if (this.isRFPEmail(email)) {
        console.log('🎯 Detected potential RFP email, consider auto-creating RFP');
        // You can implement auto-RFP creation logic here
      }

    } catch (error) {
      console.error('Error processing email:', error);
    }
  }

  extractAddresses(addressObj) {
    if (!addressObj) return null;
    if (typeof addressObj === 'string') return addressObj;
    if (addressObj.text) return addressObj.text;
    if (Array.isArray(addressObj.value)) {
      return addressObj.value.map(a => a.address).join(', ');
    }
    return null;
  }

  extractHeaders(headers) {
    const result = {};
    if (headers) {
      headers.forEach((value, key) => {
        result[key] = Array.isArray(value) ? value.join(', ') : value.toString();
      });
    }
    return result;
  }

  isRFPEmail(email) {
    const rfpKeywords = ['rfp', 'request for proposal', 'bid', 'tender', 'quotation', 'quote'];
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    
    return rfpKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }
}

