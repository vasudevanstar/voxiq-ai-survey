import React, { useState } from 'react';
import { Mail, Settings, Bell } from 'lucide-react';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { EmailTemplateBuilder } from './EmailTemplateBuilder';
import { useEmailNotifications } from '../hooks/useEmailNotifications';

interface SurveyNotificationIntegrationProps {
  surveyId: string;
  surveyTitle: string;
  onResponseSubmitted?: (responseData: any) => void;
}

/**
 * Complete integration example showing how to use email notifications
 * with a survey component
 */
export const SurveyNotificationIntegration: React.FC<SurveyNotificationIntegrationProps> = ({
  surveyId,
  surveyTitle,
  onResponseSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'preview'>('settings');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [responseData, setResponseData] = useState({
    respondent_name: 'John Doe',
    respondent_email: 'john@example.com',
    question_1: 'This is a great product',
    question_2: '4',
    question_3: 'Would recommend to friends',
  });

  const { triggerNotification, templates, addTemplate } = useEmailNotifications(surveyId);

  // Example: Handle survey response submission
  const handleSubmitResponse = async (data: any) => {
    console.log('Response submitted:', data);

    // 1. Save to database (implement in real app)
    // await saveSurveyResponse(surveyId, data);

    // 2. Trigger email notification to team
    if (data.respondent_name) {
      try {
        await triggerNotification(surveyTitle, data.respondent_name, data);
        console.log('Notification email sent');
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    // 3. Call parent callback
    onResponseSubmitted?.(data);

    // 4. Clear form (if needed)
    setResponseData({
      respondent_name: '',
      respondent_email: '',
      question_1: '',
      question_2: '',
      question_3: '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="text-brand-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-white">Survey Notifications</h1>
            <p className="text-slate-400">{surveyTitle}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-brand-primary/20">
        {[
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'templates', label: 'Templates', icon: Mail },
          { id: 'preview', label: 'Preview', icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-400 hover:text-brand-accent'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <EmailNotificationSettings
            surveyId={surveyId}
            surveyTitle={surveyTitle}
            onSettingsSaved={() => {
              console.log('Email settings saved successfully');
            }}
          />
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Email Templates</h3>
              <button
                onClick={() => setShowTemplateBuilder(!showTemplateBuilder)}
                className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Create Template
              </button>
            </div>

            {showTemplateBuilder && (
              <EmailTemplateBuilder
                onSave={template => {
                  addTemplate({
                    id: `template_${Date.now()}`,
                    name: template.name,
                    subject: template.subject,
                    body: template.body,
                    variables: [],
                  });
                  setShowTemplateBuilder(false);
                }}
                onCancel={() => setShowTemplateBuilder(false)}
              />
            )}

            {/* Templates List */}
            <div className="grid gap-4">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="glass p-4 rounded-lg border border-brand-primary/20 hover:border-brand-primary/50 transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-1">{template.name}</h4>
                  <p className="text-sm text-slate-400">
                    Subject: {template.subject.substring(0, 60)}
                    {template.subject.length > 60 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Test Email Preview</h3>

            {/* Sample Response Data */}
            <div className="glass p-6 rounded-lg border border-brand-primary/20 space-y-4">
              <h4 className="font-semibold text-brand-accent">Sample Response Data</h4>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(responseData).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 uppercase">{key}</label>
                    <input
                      type="text"
                      value={value as string}
                      onChange={e => setResponseData({ ...responseData, [key]: e.target.value })}
                      className="w-full px-3 py-2 mt-1 bg-brand-primary/5 border border-brand-primary/20 rounded text-white text-sm"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  handleSubmitResponse({
                    ...responseData,
                    submittedAt: new Date().toISOString(),
                  })
                }
                className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-bold hover:shadow-lg transition-all"
              >
                Send Test Notification
              </button>
            </div>

            {/* Email Preview */}
            <div className="glass p-6 rounded-lg border border-brand-primary/20 space-y-4">
              <h4 className="font-semibold text-brand-accent">Email Preview</h4>

              <div className="bg-slate-900 p-6 rounded-lg space-y-3 font-mono text-sm">
                <div>
                  <span className="text-slate-500">From:</span>
                  <span className="text-white ml-2">noreply@surveysense.ai</span>
                </div>

                <div>
                  <span className="text-slate-500">To:</span>
                  <span className="text-white ml-2">team@yourcompany.com</span>
                </div>

                <div>
                  <span className="text-slate-500">Subject:</span>
                  <span className="text-white ml-2">New Response: {surveyTitle}</span>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <span className="text-slate-500">Body:</span>
                  <div className="text-white mt-2 whitespace-pre-wrap">
                    {`Hi Team,

A new response has been submitted to "${surveyTitle}"

Respondent: ${responseData.respondent_name}
Email: ${responseData.respondent_email}
Submitted: ${new Date().toLocaleString()}

Responses:
• Q1: ${responseData.question_1}
• Q2: ${responseData.question_2}
• Q3: ${responseData.question_3}

---
Survey Sense | AI-Powered Decision Intelligence`}
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Tips */}
            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-lg">
              <h5 className="font-semibold text-brand-accent mb-2">Integration Tips</h5>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>✓ Add this component to your survey settings page</li>
                <li>✓ Call handleSubmitResponse() when survey responses are submitted</li>
                <li>✓ Configure email recipients before going live</li>
                <li>✓ Always send a test email before enabling in production</li>
                <li>✓ Monitor email delivery in your email service dashboard</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
