import nodemailer from "nodemailer";
import Imap from "imap";
import { simpleParser } from "mailparser";

import { Vendor } from "../models/Vendor.js";
import { Rfp } from "../models/Rfp.js";

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendRfpEmails = async (rfp, vendors) => {
  const transporter = createTransporter();
  const mailPromises = vendors.map(vendor => {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: vendor.email,
      subject: `RFP: ${rfp.title} | ID:${rfp._id}`,  // ⬅️ include RFP ID for tracking
      text: `Dear ${vendor.name},

We are inviting you to submit a proposal for the following RFP:

${rfp.description || ""}

Budget: ${rfp.budget || "N/A"}
Delivery timeline: ${rfp.deliveryTimeline || "N/A"}
Payment terms: ${rfp.paymentTerms || "N/A"}

Please reply to this email with your detailed proposal.

Best regards,
Procurement Team`
    };
    return transporter.sendMail(mailOptions);
  });

  await Promise.all(mailPromises);
};

// ⬇️ New: Auto-parse vendor replies and send to proposal parser
export const fetchVendorEmails = async () => {
  return new Promise((resolve, reject) => {
    try {
      const imap = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: process.env.IMAP_TLS !== "false",
        tlsOptions: { 
          rejectUnauthorized: false,
          servername: process.env.IMAP_HOST || 'imap.gmail.com'
        },
        authTimeout: 30000,
        connTimeout: 30000,
        keepalive: true
        // debug: console.log // Uncomment to enable IMAP protocol debugging
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          imap.search(['UNSEEN'], async (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              console.log('No unread emails found');
              imap.end();
              resolve();
              return;
            }

            const fetchRequest = imap.fetch(results, { bodies: '', markSeen: false });

            fetchRequest.on('message', (msg, seqno) => {
              let buffer = '';

              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    // Parse the email using mailparser
                    const parsed = await simpleParser(buffer);

                    const subject = parsed.subject || '';
                    const from = parsed.from?.text || parsed.from?.value?.[0]?.address || '';
                    const body = parsed.text || parsed.html || ''; // Use text, fallback to html

                    console.log('📩 Incoming reply:', subject);
                    console.log('From:', from);
                    const fromSplit = from.split(' ');
                    const emailAddr = fromSplit.length > 0 ? fromSplit[fromSplit.length - 1].replace(/[<>]/g, '') : from;

                    // Extract email address from the from field
                    const emailAddr1 = from.match(/<(.+?)>/)?.[1] || from.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || from;
                    console.log('Extracted email address:', emailAddr1);

                    // Find vendor by email
                    const vendor = await Vendor.findOne({ email: emailAddr });
                    // Find RFP ID from subject
                    const rfpIdMatch = subject.match(/ID:([a-f0-9]+)/i);
                    const subSplit = subject.split('ID:');
                    const rfpIdText = subSplit.length > 1 ? subSplit[subSplit.length - 1].trim() : null;
                    console.log('Extracted RFP ID from subject:', rfpIdText);
                    const rfp = rfpIdMatch ? await Rfp.findById(rfpIdMatch[1]) : null;

                    console.log('Identified vendor:', vendor);
                    console.log('Identified RFP:', rfp);

                    if (!vendor || !rfp) {
                      console.log('⚠ Vendor or RFP not found for reply email — skipping');
                      console.log('Email:', emailAddr, 'Vendor found:', !!vendor, 'RFP found:', !!rfp);
                      return;
                    }

                    // Send to AI → proposal controller
                    const response = await fetch('http://localhost:5000/api/ai/parse-vendor-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        vendorId: vendor._id,
                        rfpId: rfp._id,
                        rawEmailId: parsed.messageId,
                        emailBody: body
                      })
                    });

                    console.log('✅ Proposal extracted and saved for vendor:', vendor.name);
                  } catch (error) {
                    console.error('Error processing email:', error);
                  }
                });
              });
            });

            fetchRequest.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });

            fetchRequest.once('end', () => {
              console.log('Done fetching all messages');
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('Connection ended');
        resolve();
      });

      imap.connect();
    } catch (error) {
      console.error('Failed to fetch Emails', error);
      reject(error);
    }
  });
};
