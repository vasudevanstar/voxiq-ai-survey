import React, { useState, useRef } from 'react';
import { Upload, X, AlertTriangle, CheckCircle2, Loader2, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { ImportService, ImportResult } from '../services/importService';
import { analyzeSurveyData } from '../services/geminiService';
import { DataConsistencyService } from '../services/dataConsistencyService';
import { Survey, Response } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (responses: Response[]) => void;
  surveys: Survey[];
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete, surveys }) => {
  const [selectedSurvey, setSelectedSurvey] = useState<string>(surveys[0]?.id || '');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await ImportService.importFile(file, selectedSurvey);
      setImportResult(result);

      if (result.success && result.data.length > 0) {
        // Auto-analyze the imported data
        setIsAnalyzing(true);
        const survey = surveys.find(s => s.id === selectedSurvey);
        if (survey) {
          const analysis = await analyzeSurveyData(survey, result.data.slice(0, 100));
          setAnalysisResults(analysis);
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        rowsImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error during import'],
        data: []
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.success && importResult.data.length > 0) {
      // Register imported data with consistency service
      const fileName = importResult.data[0]?._importFileName || 'imported-data';
      const source = importResult.data[0]?._importSource || 'csv';
      
      DataConsistencyService.registerImportedData(
        selectedSurvey,
        importResult.data,
        fileName,
        source as 'excel' | 'csv' | 'json'
      );

      // Callback to parent component
      onImportComplete(importResult.data);
      handleClose();
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setAnalysisResults(null);
    setIsAnalyzing(false);
    onClose();
  };

  if (!isOpen) return null;

  const survey = surveys.find(s => s.id === selectedSurvey);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Upload size={24} className="text-emerald-400" />
              Import Survey Data
            </h2>
            <p className="text-sm text-slate-400 mt-1">Import responses from CSV, Excel, or JSON files</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Survey Selection */}
          {!importResult && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Select Survey</label>
                <select
                  value={selectedSurvey}
                  onChange={(e) => setSelectedSurvey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  {surveys.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {survey && (
                  <p className="text-xs text-slate-400 mt-2">
                    {survey.questions.length} questions • {survey.description}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Choose File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer"
                >
                  <Upload size={32} className="mx-auto mb-3 text-emerald-400" />
                  <p className="text-slate-300 font-bold">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">CSV, Excel (.xlsx), or JSON files accepted</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          )}

          {/* Import Status */}
          {importResult && (
            <div className={`p-4 rounded-xl border flex gap-3 ${
              importResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              {importResult.success ? (
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={24} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-bold ${importResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {importResult.success
                    ? `✓ Successfully imported ${importResult.rowsImported} rows`
                    : `✕ Import encountered ${importResult.errors.length} error(s)`
                  }
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="text-xs text-slate-400 mt-2 space-y-1 max-h-24 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-slate-500">... and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResults && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-brand-primary/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-brand-primary" />
                  <h3 className="font-bold text-brand-primary">AI Analysis Summary</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">"{analysisResults.summary}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sentiment Score */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Sentiment Score</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {(analysisResults.sentimentScore * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Response Count */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Responses</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {importResult?.rowsImported || 0}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    Key Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.recommendations.slice(0, 3).map((rec: string, i: number) => (
                      <li key={i} className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-slate-300 flex gap-2">
                        <span className="text-emerald-400 font-bold">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {analysisResults.weakAreas && analysisResults.weakAreas.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-400" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.weakAreas.slice(0, 3).map((area: string, i: number) => (
                      <li key={i} className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-slate-300 flex gap-2">
                        <span className="text-rose-400 font-bold">⚠</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trends */}
              {analysisResults.trends && analysisResults.trends.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-400" />
                    Identified Trends
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.trends.slice(0, 3).map((trend: string, i: number) => (
                      <li key={i} className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-slate-300 flex gap-2">
                        <span className="text-blue-400 font-bold">📈</span>
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Loading States */}
          {isImporting && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-3 text-emerald-400" size={32} />
              <p className="text-slate-400">Importing and analyzing your data...</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-3 text-brand-primary" size={32} />
              <p className="text-slate-400">Analyzing imported responses with AI...</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700/50 p-6 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 glass rounded-xl text-slate-300 hover:text-white font-bold transition-all hover:bg-slate-800"
          >
            Cancel
          </button>
          {importResult?.success && !isAnalyzing && (
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 btn-gradient rounded-xl font-bold transition-all"
            >
              Confirm & Add Data
            </button>
          )}
          {!importResult && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-6 py-2.5 btn-gradient rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Choose File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
