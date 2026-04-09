import React, { useState } from 'react';
import { Mail, Plus, Trash2, Check, X, AlertCircle, Send } from 'lucide-react';
import { useEmailNotifications } from '../hooks/useEmailNotifications';

interface EmailNotificationSettingsProps {
  surveyId: string;
  surveyTitle: string;
  onSettingsSaved?: () => void;
}

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  surveyId,
  surveyTitle,
  onSettingsSaved,
}) => {
  const { settings, templates, isLoading, error, updateSettings, sendTestEmail, addTemplate, deleteTemplate } =
    useEmailNotifications(surveyId);

  const [newEmail, setNewEmail] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
  });

  const handleAddEmail = () => {
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return;
    }

    const updated = [...(settings?.emailAddresses || []), newEmail];
    updateSettings({ emailAddresses: updated });
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    const updated = (settings?.emailAddresses || []).filter(e => e !== email);
    updateSettings({ emailAddresses: updated });
  };

  const handleToggleNotifications = () => {
    updateSettings({ enabled: !settings?.enabled });
  };

  const handleSendTest = async () => {
    if (!testEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setTestResult({ success: false, message: 'Invalid email address' });
      return;
    }

    setIsSendingTest(true);
    const success = await sendTestEmail(testEmail);
    setTestResult({
      success,
      message: success ? 'Test email sent successfully!' : 'Failed to send test email',
    });
    setIsSendingTest(false);

    if (success) {
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      return;
    }

    addTemplate({
      id: `template_${Date.now()}`,
      name: newTemplate.name,
      subject: newTemplate.subject,
      body: newTemplate.body,
      variables: [],
    });

    setNewTemplate({ name: '', subject: '', body: '' });
    setShowNewTemplate(false);
  };

  if (!settings) return <div className="text-slate-400">Loading notification settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mail className="text-brand-primary" size={24} />
        <div>
          <h2 className="text-2xl font-bold text-white">Email Notifications</h2>
          <p className="text-slate-400 text-sm">Manage response notifications for {surveyTitle}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Enable Email Notifications</h3>
            <p className="text-sm text-slate-400 mt-1">
              {settings.enabled ? 'Notifications are active' : 'Notifications are disabled'}
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
              settings.enabled ? 'bg-gradient-to-r from-brand-primary to-brand-secondary' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* Notification Type */}
          <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4">
            <label className="text-sm font-bold text-brand-accent">Notification Frequency</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'every_response', label: 'Every Response' },
                { id: 'daily_digest', label: 'Daily Digest' },
                { id: 'weekly_digest', label: 'Weekly Digest' },
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateSettings({ notifyOn: option.id as any })}
                  className={`p-3 rounded-lg border transition-all ${
                    settings.notifyOn === option.id
                      ? 'bg-gradient-to-br from-brand-primary/30 to-brand-secondary/20 border-brand-primary/50 text-brand-primary'
                      : 'bg-brand-primary/5 border-brand-primary/20 text-slate-400 hover:bg-brand-primary/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Recipients */}
          <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4">
            <h3 className="font-bold text-white">Email Recipients</h3>

            {/* Add Email */}
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddEmail()}
                placeholder="Add recipient email"
                className="flex-1 px-4 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
              />
              <button
                onClick={handleAddEmail}
                className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Recipients List */}
            <div className="space-y-2">
              {settings.emailAddresses.length === 0 ? (
                <p className="text-slate-400 text-sm">No recipients added yet</p>
              ) : (
                settings.emailAddresses.map(email => (
                  <div key={email} className="flex items-center justify-between p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                    <span className="text-white">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Send Test Email */}
          <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4">
            <h3 className="font-bold text-white">Send Test Email</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="Test email address"
                className="flex-1 px-4 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
              />
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || settings.emailAddresses.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {testResult.success ? <Check size={18} /> : <X size={18} />}
                {testResult.message}
              </div>
            )}
          </div>

          {/* Email Templates */}
          <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Email Templates</h3>
              <button
                onClick={() => setShowNewTemplate(!showNewTemplate)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/20 text-brand-accent rounded-lg hover:bg-brand-primary/30 transition-all"
              >
                <Plus size={16} />
                New Template
              </button>
            </div>

            {showNewTemplate && (
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg space-y-3 animate-scale-in">
                <input
                  type="text"
                  placeholder="Template Name"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-sm text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={newTemplate.subject}
                  onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-sm text-white placeholder-slate-500"
                />
                <textarea
                  placeholder="Email Body"
                  value={newTemplate.body}
                  onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-sm text-white placeholder-slate-500 h-24"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTemplate}
                    className="flex-1 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded font-semibold hover:shadow-lg transition-all"
                  >
                    Create Template
                  </button>
                  <button
                    onClick={() => setShowNewTemplate(false)}
                    className="px-4 py-2 bg-brand-primary/10 text-brand-accent rounded hover:bg-brand-primary/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Templates List */}
            <div className="space-y-2">
              {templates.map(template => (
                <div key={template.id} className="p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{template.name}</h4>
                    {!['default', 'detailed', 'summary'].includes(template.id) && (
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {template.subject.substring(0, 60)}
                    {template.subject.length > 60 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={() => onSettingsSaved?.()}
            className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            Save Email Notification Settings
          </button>
        </>
      )}
    </div>
  );
};
