import React, { useState } from 'react';
import { Filter, X, Check, Download } from 'lucide-react';

interface ResponseFilterUIProps {
  onFilterChange: (filters: any) => void;
}

export const ResponseFilterUI: React.FC<ResponseFilterUIProps> = ({ onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all logic
      setSelectedResponses(new Set());
    } else {
      setSelectedResponses(new Set());
    }
  };

  const handleApplyFilters = () => {
    onFilterChange({
      dateRange: dateRange.start && dateRange.end ? {
        startDate: new Date(dateRange.start),
        endDate: new Date(dateRange.end),
      } : null,
    });
    setShowFilters(false);
  };

  return (
    <div className="space-y-4 animate-slide-in-down">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-brand-primary/20 text-slate-400 hover:text-brand-accent hover:border-brand-primary/40 transition-all"
        >
          <Filter size={18} />
          Filters
        </button>
        {selectedResponses.size > 0 && (
          <div className="text-sm text-brand-accent">
            {selectedResponses.size} selected
          </div>
        )}
      </div>

      {showFilters && (
        <div className="glass p-4 rounded-xl border border-brand-primary/20 space-y-4 animate-scale-in">
          <div className="space-y-3">
            <label className="text-sm font-bold text-brand-accent">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg text-white text-sm focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg text-white text-sm focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
                placeholder="End Date"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Apply Filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ConditionalLogicUIProps {
  questionId: string;
  onAdd: (rule: any) => void;
}

export const ConditionalLogicUI: React.FC<ConditionalLogicUIProps> = ({ questionId, onAdd }) => {
  const [showLogic, setShowLogic] = useState(false);
  const [rule, setRule] = useState({
    triggerQuestion: '',
    operator: 'equals',
    value: '',
    action: 'show',
  });

  const handleAddRule = () => {
    onAdd({ ...rule, questionId });
    setRule({ triggerQuestion: '', operator: 'equals', value: '', action: 'show' });
    setShowLogic(false);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowLogic(!showLogic)}
        className="text-sm px-3 py-1.5 bg-brand-primary/10 text-brand-accent rounded-lg hover:bg-brand-primary/20 transition-all"
      >
        Add Logic
      </button>

      {showLogic && (
        <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg space-y-3 animate-scale-in">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={rule.operator}
              onChange={(e) => setRule({ ...rule, operator: e.target.value })}
              className="px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-sm text-white"
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="greaterThan">Greater Than</option>
              <option value="lessThan">Less Than</option>
            </select>

            <select
              value={rule.action}
              onChange={(e) => setRule({ ...rule, action: e.target.value })}
              className="px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-sm text-white"
            >
              <option value="show">Show Question</option>
              <option value="hide">Hide Question</option>
              <option value="required">Make Required</option>
              <option value="optional">Make Optional</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Trigger value"
            value={rule.value}
            onChange={(e) => setRule({ ...rule, value: e.target.value })}
            className="w-full px-3 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-sm text-white placeholder-slate-500"
          />

          <button
            onClick={handleAddRule}
            className="w-full py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded font-semibold hover:shadow-lg transition-all"
          >
            Add Conditional Logic
          </button>
        </div>
      )}
    </div>
  );
};

interface BulkActionUIProps {
  selectedCount: number;
  onBulkAction: (action: string, metadata?: any) => void;
}

export const BulkActionUI: React.FC<BulkActionUIProps> = ({ selectedCount, onBulkAction }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-lg flex items-center justify-between gap-4 animate-slide-in-down">
      <span className="text-sm font-semibold text-brand-accent">
        {selectedCount} response{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => onBulkAction('export')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Download size={16} />
          Export
        </button>
        <button
          onClick={() => onBulkAction('tag')}
          className="px-4 py-2 bg-brand-primary/20 text-brand-accent rounded-lg hover:bg-brand-primary/30 transition-all font-semibold"
        >
          Tag
        </button>
        <button
          onClick={() => onBulkAction('delete')}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all font-semibold"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

interface BrandingConfigUIProps {
  onSave: (branding: any) => void;
}

export const BrandingConfigUI: React.FC<BrandingConfigUIProps> = ({ onSave }) => {
  const [branding, setBranding] = useState({
    companyName: 'Survey Sense',
    primaryColor: '#00d9ff',
    secondaryColor: '#ff006e',
    accentColor: '#00f5ff',
    footerText: '© Survey Sense | AI-Powered Decision Intelligence',
  });

  const handleSave = () => {
    onSave(branding);
  };

  return (
    <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4 animate-slide-in-up">
      <h3 className="text-lg font-bold text-white">Branding Settings</h3>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Company Name"
          value={branding.companyName}
          onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
          className="w-full px-4 py-3 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-brand-accent mb-2 block">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-brand-accent mb-2 block">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-brand-accent mb-2 block">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.accentColor}
                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-brand-primary/5 border border-brand-primary/30 rounded text-sm text-white"
              />
            </div>
          </div>
        </div>

        <textarea
          placeholder="Footer Text"
          value={branding.footerText}
          onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
          className="w-full px-4 py-3 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all text-sm h-20"
        />

        <button
          onClick={handleSave}
          className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-bold hover:shadow-lg transition-all"
        >
          Save Branding
        </button>
      </div>
    </div>
  );
};
