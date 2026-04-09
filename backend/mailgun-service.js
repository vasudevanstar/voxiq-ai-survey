/**
 * Mailgun Email Service
 * Handles all email sending operations with Mailgun API
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

class MailgunService {
  constructor(apiKey, domain) {
    this.apiKey = apiKey;
    this.domain = domain;
    this.baseUrl = `https://api.mailgun.net/v3/${domain}`;
    this.auth = {
      username: 'api',
      password: apiKey,
    };
  }

  /**
   * Validates email format
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sends an email using Mailgun
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.from - Sender email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} [options.text] - Email text content (optional)
   * @returns {Promise<Object>} - Mailgun response
   */
  async sendEmail({
    to,
    from = 'noreply@surveyense.com',
    subject,
    html,
    text = '',
  }) {
    try {
      // Validate inputs
      if (!to || !subject || !html) {
        throw new Error('Missing required fields: to, subject, html');
      }

      if (!this.isValidEmail(to)) {
        throw new Error(`Invalid recipient email: ${to}`);
      }

      if (!this.isValidEmail(from)) {
        throw new Error(`Invalid sender email: ${from}`);
      }

      // Create form data for Mailgun API
      const form = new FormData();
      form.append('from', from);
      form.append('to', to);
      form.append('subject', subject);
      form.append('html', html);
      if (text) {
        form.append('text', text);
      }

      // Send request to Mailgun
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        auth: `${this.auth.username}:${this.auth.password}`,
        body: form,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.id,
        message: 'Email sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Mailgun error:', error.message);
      throw {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sends bulk emails to multiple recipients
   * @param {Object} options - Bulk email options
   * @param {Array<string>} options.to - Array of recipient emails
   * @param {string} options.from - Sender email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @returns {Promise<Array>} - Array of results
   */
  async sendBulkEmail({ to, from, subject, html, text }) {
    const results = [];

    for (const recipient of to) {
      try {
        const result = await this.sendEmail({
          to: recipient,
          from,
          subject,
          html,
          text,
        });
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          email: recipient,
          error: error.message || error.error,
        });
      }
    }

    return {
      total: to.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Sends test email to verify service is working
   * @param {string} to - Test recipient email
   * @returns {Promise<Object>} - Test result
   */
  async sendTestEmail(to) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00d9ff;">✅ Test Email from Survey Sense</h2>
        <p>If you received this email, Mailgun is configured correctly!</p>
        <hr style="border: 1px solid #00d9ff; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          <strong>Test Details:</strong><br>
          Service: Mailgun<br>
          Domain: ${this.domain}<br>
          Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '✅ Test Email - Survey Sense',
      html,
      text: 'Test email from Survey Sense',
    });
  }

  /**
   * Verifies Mailgun credentials are valid
   * @returns {Promise<boolean>} - True if credentials are valid
   */
  async verifyCredentials() {
    try {
      const response = await fetch(`https://api.mailgun.net/v3/domains`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.auth.username}:${this.auth.password}`
          ).toString('base64')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Credential verification failed:', error.message);
      return false;
    }
  }
}

export default MailgunService;
