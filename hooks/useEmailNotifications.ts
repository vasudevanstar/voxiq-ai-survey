/**
 * Email Notification Hook
 * Manages email notification settings and triggers
 */

import { useState, useCallback, useEffect } from 'react';
import { EmailNotificationSettings, EmailTemplate } from '../types/survey';
import { NotificationService } from '../services/advancedFeaturesService';

interface UseEmailNotificationsReturn {
  settings: EmailNotificationSettings | null;
  templates: EmailTemplate[];
  isLoading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<EmailNotificationSettings>) => Promise<void>;
  sendTestEmail: (email: string) => Promise<boolean>;
  addTemplate: (template: EmailTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  triggerNotification: (surveyId: string, respondentName: string, responseData: any) => Promise<void>;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'default',
    name: 'Default Response Notification',
    subject: 'New Response: {{surveyTitle}}',
    body: `Hi {{teamName}},

A new response has been submitted to "{{surveyTitle}}"

**Respondent:** {{respondentName}}
**Submitted:** {{timestamp}}

---
Survey Sense | AI-Powered Decision Intelligence`,
    variables: ['surveyTitle', 'teamName', 'respondentName', 'timestamp'],
  },
  {
    id: 'detailed',
    name: 'Detailed Response Report',
    subject: 'Detailed Report: {{surveyTitle}} - {{respondentName}}',
    body: `Hi {{teamName}},

Here are the complete responses from {{respondentName}}:

{{responseContent}}

**Submitted:** {{timestamp}}
**Response Time:** {{responseTime}} minutes

---
Survey Sense | AI-Powered Decision Intelligence`,
    variables: ['surveyTitle', 'teamName', 'respondentName', 'responseContent', 'timestamp', 'responseTime'],
  },
  {
    id: 'summary',
    name: 'Daily Summary',
    subject: 'Daily Summary: {{surveyTitle}}',
    body: `Hi {{teamName}},

Here's your daily summary for "{{surveyTitle}}":

**New Responses:** {{responseCount}}
**Completion Rate:** {{completionRate}}%
**Average Time:** {{averageTime}} minutes

View full analytics at: {{dashboardLink}}

---
Survey Sense | AI-Powered Decision Intelligence`,
    variables: ['surveyTitle', 'teamName', 'responseCount', 'completionRate', 'averageTime', 'dashboardLink'],
  },
];

export const useEmailNotifications = (surveyId: string): UseEmailNotificationsReturn => {
  const [settings, setSettings] = useState<EmailNotificationSettings | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`email_notifications_${surveyId}`);
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings({
          id: `notif_${surveyId}`,
          surveyId,
          enabled: false,
          emailAddresses: [],
          notifyOn: 'every_response',
          emailTemplate: 'default',
        });
      }
    } catch (err) {
      setError('Failed to load email notification settings');
    }
  }, [surveyId]);

  const updateSettings = useCallback(
    async (updates: Partial<EmailNotificationSettings>) => {
      setIsLoading(true);
      try {
        const updated = { ...settings, ...updates } as EmailNotificationSettings;
        setSettings(updated);
        localStorage.setItem(`email_notifications_${surveyId}`, JSON.stringify(updated));
        setError(null);
      } catch (err) {
        setError('Failed to update notification settings');
      } finally {
        setIsLoading(false);
      }
    },
    [settings, surveyId]
  );

  const sendTestEmail = useCallback(
    async (email: string) => {
      try {
        const template = templates.find(t => t.id === settings?.emailTemplate);
        if (!template) {
          setError('Template not found');
          return false;
        }

        const result = await NotificationService.sendEmail(
          [email],
          'Survey Sense - Test Email',
          `This is a test email from Survey Sense notifications system.\n\nTemplate: ${template.name}`
        );

        if (result.success) {
          setError(null);
          return true;
        } else {
          setError(result.error || 'Failed to send test email');
          return false;
        }
      } catch (err) {
        setError('Error sending test email');
        return false;
      }
    },
    [settings, templates]
  );

  const addTemplate = useCallback((template: EmailTemplate) => {
    setTemplates(prev => [...prev, template]);
    localStorage.setItem(`email_templates_${surveyId}`, JSON.stringify([...templates, template]));
  }, [templates, surveyId]);

  const deleteTemplate = useCallback(
    (templateId: string) => {
      if (templateId === 'default' || templateId === 'detailed' || templateId === 'summary') {
        setError('Cannot delete default templates');
        return;
      }
      const filtered = templates.filter(t => t.id !== templateId);
      setTemplates(filtered);
      localStorage.setItem(`email_templates_${surveyId}`, JSON.stringify(filtered));
    },
    [templates, surveyId]
  );

  const triggerNotification = useCallback(
    async (surveyTitle: string, respondentName: string, responseData: any) => {
      if (!settings?.enabled || settings.emailAddresses.length === 0) {
        return;
      }

      try {
        const { subject, body } = NotificationService.generateResponseEmail(
          surveyTitle,
          respondentName,
          responseData,
          'Survey Sense'
        );

        await NotificationService.sendEmail(settings.emailAddresses, subject, body);
        setError(null);
      } catch (err) {
        setError('Failed to send notification email');
      }
    },
    [settings]
  );

  return {
    settings,
    templates,
    isLoading,
    error,
    updateSettings,
    sendTestEmail,
    addTemplate,
    deleteTemplate,
    triggerNotification,
  };
};
