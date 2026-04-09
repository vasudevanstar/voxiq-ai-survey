import React, { useState } from 'react';
import { FileText, Eye, Edit2, Save, X } from 'lucide-react';

interface EmailTemplateBuilderProps {
  onSave: (template: { name: string; subject: string; body: string }) => void;
  onCancel?: () => void;
  defaultTemplate?: { name: string; subject: string; body: string };
}

const TEMPLATE_VARIABLES = [
  { key: '{{surveyTitle}}', description: 'Survey Title' },
  { key: '{{respondentName}}', description: 'Respondent Name' },
  { key: '{{respondentEmail}}', description: 'Respondent Email' },
  { key: '{{timestamp}}', description: 'Response Timestamp' },
  { key: '{{responseTime}}', description: 'Time to Complete (minutes)' },
  { key: '{{responseCount}}', description: 'Total Response Count' },
  { key: '{{completionRate}}', description: 'Completion Rate %' },
  { key: '{{teamName}}', description: 'Team Name' },
  { key: '{{companyName}}', description: 'Company Name' },
];

export const EmailTemplateBuilder: React.FC<EmailTemplateBuilderProps> = ({
  onSave,
  onCancel,
  defaultTemplate,
}) => {
  const [name, setName] = useState(defaultTemplate?.name || '');
  const [subject, setSubject] = useState(defaultTemplate?.subject || '');
  const [body, setBody] = useState(defaultTemplate?.body || '');
  const [preview, setPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + variable + body.substring(end);
      setBody(newBody);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }
  };

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      return;
    }
    onSave({ name, subject, body });
  };

  const previewSubject = subject
    .replace(/\{\{surveyTitle\}\}/g, 'Example Survey')
    .replace(/\{\{respondentName\}\}/g, 'John Doe');

  const previewBody = body
    .replace(/\{\{surveyTitle\}\}/g, 'Example Survey')
    .replace(/\{\{respondentName\}\}/g, 'John Doe')
    .replace(/\{\{respondentEmail\}\}/g, 'john@example.com')
    .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())
    .replace(/\{\{responseTime\}\}/g, '5')
    .replace(/\{\{responseCount\}\}/g, '42')
    .replace(/\{\{completionRate\}\}/g, '85')
    .replace(/\{\{teamName\}\}/g, 'Sales Team')
    .replace(/\{\{companyName\}\}/g, 'Company Name');

  if (preview) {
    return (
      <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Eye size={20} />
            Email Preview
          </h3>
          <button
            onClick={() => setPreview(false)}
            className="p-2 hover:bg-brand-primary/20 rounded transition-all"
          >
            <Edit2 size={18} className="text-brand-accent" />
          </button>
        </div>

        <div className="space-y-4 bg-slate-900/50 p-6 rounded-lg border border-slate-700">
          <div>
            <label className="text-xs text-brand-accent uppercase font-bold">From</label>
            <p className="text-white">noreply@surveysense.ai</p>
          </div>

          <div>
            <label className="text-xs text-brand-accent uppercase font-bold">Subject</label>
            <p className="text-white break-words">{previewSubject}</p>
          </div>

          <div>
            <label className="text-xs text-brand-accent uppercase font-bold">Body</label>
            <div className="bg-white text-slate-900 p-4 rounded mt-2 whitespace-pre-wrap text-sm leading-relaxed font-mono">
              {previewBody}
            </div>
          </div>
        </div>

        <button
          onClick={() => setPreview(false)}
          className="w-full py-2 bg-brand-primary/20 text-brand-accent rounded-lg hover:bg-brand-primary/30 transition-all font-semibold"
        >
          Back to Editor
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <FileText size={20} />
          Email Template Builder
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-red-500/20 rounded transition-all"
          >
            <X size={18} className="text-red-400" />
          </button>
        )}
      </div>

      {/* Template Name */}
      <div>
        <label className="text-sm font-bold text-brand-accent block mb-2">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Weekly Digest Template"
          className="w-full px-4 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
        />
      </div>

      {/* Email Subject */}
      <div>
        <label className="text-sm font-bold text-brand-accent block mb-2">Email Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g., New Response: {{surveyTitle}}"
          className="w-full px-4 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
        />
      </div>

      {/* Email Body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-brand-accent">Email Body</label>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="text-xs px-2 py-1 bg-brand-primary/20 text-brand-accent rounded hover:bg-brand-primary/30 transition-all"
          >
            Variables
          </button>
        </div>

        <textarea
          id="email-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your email template here..."
          className="w-full px-4 py-3 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all font-mono text-sm h-32"
        />

        {showVariables && (
          <div className="mt-3 p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20 animate-scale-in">
            <p className="text-xs text-slate-400 mb-2">Click a variable to insert it:</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_VARIABLES.map(variable => (
                <button
                  key={variable.key}
                  onClick={() => handleInsertVariable(variable.key)}
                  className="text-left px-2 py-1.5 bg-brand-primary/20 text-brand-accent text-xs rounded hover:bg-brand-primary/40 transition-all"
                  title={variable.description}
                >
                  <code className="font-bold">{variable.key}</code>
                  <br />
                  <span className="text-slate-400">{variable.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={() => setPreview(true)}
          className="flex-1 py-2 bg-brand-primary/20 text-brand-accent rounded-lg hover:bg-brand-primary/30 transition-all font-semibold flex items-center justify-center gap-2"
        >
          <Eye size={16} />
          Preview
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !subject.trim() || !body.trim()}
          className="flex-1 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          Save Template
        </button>
      </div>
    </div>
  );
};
