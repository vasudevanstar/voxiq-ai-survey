/**
 * Express Server with Email API Endpoints
 * Integrates Mailgun for email delivery
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import MailgunService from './mailgun-service.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Mailgun Service
const mailgun = new MailgunService(
  process.env.MAILGUN_API_KEY || 'your-api-key-here',
  process.env.MAILGUN_DOMAIN || 'sandbox.mailgun.org'
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Survey Sense Email API',
    timestamp: new Date().toISOString(),
  });
});

// Verify Mailgun credentials
app.get('/api/verify-email-service', async (req, res) => {
  try {
    const isValid = await mailgun.verifyCredentials();

    if (isValid) {
      res.json({
        success: true,
        message: 'Mailgun service is configured correctly',
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
      error: 'Failed to verify email service',
      details: error.message,
    });
  }
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['to', 'subject', 'html'],
      });
    }

    // Send email using Mailgun
    const result = await mailgun.sendEmail({
      to,
      subject,
      html,
      text: text || '',
      from: from || 'noreply@surveyense.com',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message || error.error,
    });
  }
});

// Send bulk emails endpoint
app.post('/api/send-bulk-email', async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body;

    // Validate required fields
    if (!Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients (to) must be a non-empty array',
      });
    }

    if (!subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, html',
      });
    }

    // Send bulk emails
    const result = await mailgun.sendBulkEmail({
      to,
      subject,
      html,
      text: text || '',
      from: from || 'noreply@surveyense.com',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ Bulk email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails',
      details: error.message,
    });
  }
});

// Send test email endpoint
app.post('/api/send-test-email', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email (to) is required',
      });
    }

    const result = await mailgun.sendTestEmail(to);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message || error.error,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Start server only if not being imported as a module (e.g., for Vercel)
if (import.meta.url === `file://${process.argv[1]}` || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('🚀 Survey Sense Email API started');
    console.log(`📧 Server running on http://localhost:${PORT}`);
    console.log(`🔧 Email service: Mailgun (${process.env.MAILGUN_DOMAIN})`);
    console.log('\n📋 Available endpoints:');
    console.log('   GET  /health                 - Health check');
    console.log('   GET  /api/verify-email-service - Verify Mailgun setup');
    console.log('   POST /api/send-email         - Send single email');
    console.log('   POST /api/send-bulk-email    - Send multiple emails');
    console.log('   POST /api/send-test-email    - Send test email');
  });
}

export default app;
