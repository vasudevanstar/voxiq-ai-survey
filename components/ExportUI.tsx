import React, { useState } from 'react';
import { Download, FileText, Sheet, Eye } from 'lucide-react';
import { ExportService } from '../services/exportService';
import { BrandingService } from '../services/brandingService';

interface ExportUIProps {
  surveyTitle: string;
  responses: any[];
  onExportComplete?: () => void;
}

export const ExportUI: React.FC<ExportUIProps> = ({ surveyTitle, responses, onExportComplete }) => {
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const branding = BrandingService.getActiveBranding();
      const options = {
        format: exportFormat as 'csv' | 'json' | 'pdf',
        includeColumns: Object.keys(responses[0] || {}),
        includeMetadata,
      };

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (exportFormat) {
        case 'csv':
          content = ExportService.exportToCSV(responses, surveyTitle, options);
          filename = ExportService.generateFilename(surveyTitle, 'csv');
          mimeType = 'text/csv';
          break;

        case 'json':
          content = ExportService.exportToJSON(responses, surveyTitle, options);
          filename = ExportService.generateFilename(surveyTitle, 'json');
          mimeType = 'application/json';
          break;

        case 'pdf':
          content = ExportService.preparePDFContent(responses, surveyTitle, options, branding || undefined);
          filename = ExportService.generateFilename(surveyTitle, 'pdf');
          mimeType = 'text/html';
          // Open in new window for PDF rendering (would need html2pdf library for actual PDF)
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(content);
            newWindow.document.close();
            newWindow.print();
          }
          break;
      }

      if (exportFormat !== 'pdf') {
        ExportService.downloadFile(content, filename, mimeType);
      }

      onExportComplete?.();
      setShowExport(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowExport(!showExport)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold"
      >
        <Download size={18} />
        Export Data
      </button>

      {showExport && (
        <div className="glass p-6 rounded-xl border border-brand-primary/20 space-y-4 animate-scale-in">
          <h3 className="font-bold text-white">Export Responses</h3>

          <div className="space-y-3">
            <label className="text-sm text-brand-accent font-semibold">Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'csv', label: 'CSV', icon: <Sheet size={20} /> },
                { id: 'json', label: 'JSON', icon: <FileText size={20} /> },
                { id: 'pdf', label: 'PDF', icon: <Eye size={20} /> },
              ].map((format) => (
                <button
                  key={format.id}
                  onClick={() => setExportFormat(format.id as any)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    exportFormat === format.id
                      ? 'bg-gradient-to-br from-brand-primary/30 to-brand-secondary/20 border-brand-primary/50 text-brand-primary'
                      : 'bg-brand-primary/5 border-brand-primary/20 text-slate-400 hover:bg-brand-primary/10'
                  }`}
                >
                  {format.icon}
                  <span className="text-xs font-bold">{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="cursor-pointer"
            />
            <span className="text-sm text-slate-300">Include metadata</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={() => setShowExport(false)}
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
