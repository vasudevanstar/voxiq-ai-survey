/**
 * Mailgun Integration Service
 * Frontend service that connects to the backend Mailgun API
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
  details?: string;
}

class MailgunIntegrationService {
  private apiBaseUrl: string;

  constructor(baseUrl: string = '') {
    this.apiBaseUrl = baseUrl;
  }

  /**
   * Verifies connection to the backend email service
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  /**
   * Sends a single email via Mailgun
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send email');
      }

      return data;
    } catch (error) {
      console.error('❌ Email send error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Sends bulk emails to multiple recipients
   */
  async sendBulkEmail(options: EmailOptions & { to: string[] }): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/send-bulk-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send bulk emails');
      }

      return data;
    } catch (error) {
      console.error('❌ Bulk email error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Sends a test email to verify the service is working
   */
  async sendTestEmail(to: string): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      return data;
    } catch (error) {
      console.error('❌ Test email error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Verifies Mailgun credentials are valid
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/verify-email-service`
      );
      return response.ok;
    } catch (error) {
      console.error('❌ Credential verification failed:', error);
      return false;
    }
  }

  /**
   * Generates HTML email from template
   */
  generateEmailHTML(
    subject: string,
    content: string,
    footer?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 3px solid #00d9ff; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #00d9ff; margin: 0; }
            .content { margin: 20px 0; }
            .footer { border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #00d9ff; color: #0a0e27; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .alert { background: #f0f7ff; border-left: 4px solid #00d9ff; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              ${footer || '<p>Survey Sense | AI-Powered Decision Intelligence</p>'}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const mailgunService = new MailgunIntegrationService();

// Also export the class for custom instances
export default MailgunIntegrationService;
