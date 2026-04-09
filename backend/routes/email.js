/**
 * Email routes
 * API endpoints for email operations
 */

import express from 'express';
import MailgunService from '../mailgun-service.js';

const router = express.Router();

// Initialize Mailgun
const mailgun = new MailgunService(
  process.env.MAILGUN_API_KEY,
  process.env.MAILGUN_DOMAIN
);

/**
 * POST /api/email/send
 * Send a single email
 * Body: { to, subject, html, text?, from? }
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html',
      });
    }

    const result = await mailgun.sendEmail({
      to,
      subject,
      html,
      text,
      from,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message || error.error,
    });
  }
});

/**
 * POST /api/email/bulk
 * Send emails to multiple recipients
 * Body: { to: [], subject, html, text?, from? }
 */
router.post('/bulk', async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body;

    if (!Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        error: 'Recipients (to) must be a non-empty array',
      });
    }

    if (!subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: subject, html',
      });
    }

    const result = await mailgun.sendBulkEmail({
      to,
      subject,
      html,
      text,
      from,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send bulk emails',
      details: error.message,
    });
  }
});

/**
 * POST /api/email/test
 * Send a test email
 * Body: { to }
 */
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Recipient email (to) is required',
      });
    }

    const result = await mailgun.sendTestEmail(to);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send test email',
      details: error.message || error.error,
    });
  }
});

/**
 * GET /api/email/verify
 * Verify Mailgun credentials
 */
router.get('/verify', async (req, res) => {
  try {
    const isValid = await mailgun.verifyCredentials();

    if (isValid) {
      res.json({
        success: true,
        message: 'Mailgun service verified',
        domain: process.env.MAILGUN_DOMAIN,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid Mailgun credentials',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: error.message,
    });
  }
});

export default router;
