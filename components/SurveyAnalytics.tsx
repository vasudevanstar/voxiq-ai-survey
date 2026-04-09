
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, Download, Sparkles, TrendingUp, AlertCircle, BarChart3, Users, Loader2, BrainCircuit, Activity, Zap, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Survey, AIAnalysis, AnalystThresholds, Response } from '../types';
import { MOCK_SURVEYS, MOCK_RESPONSES, MOCK_ALERTS } from '../constants';
import { exportToCSV } from '../services/exportService';
import { analyzeSurveyData } from '../services/geminiService';
import { ImportService, ImportResult } from '../services/importService';
import { DataConsistencyService } from '../services/dataConsistencyService';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981'];

interface SurveyAnalyticsProps {
  surveyId: string;
  onBack: () => void;
  userRole?: string;
  onImportResponses: (surveyId: string, responses: Response[]) => void;
  importedResponses: Record<string, Response[]>;
}

export const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ surveyId, onBack, userRole = 'researcher', onImportResponses, importedResponses }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<AIAnalysis | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViewer = userRole === 'researcher';
  const isAnalyst = userRole === 'analyst' || userRole === 'admin';
  
  const survey = MOCK_SURVEYS.find(s => s.id === surveyId) || MOCK_SURVEYS[0];
  const allResponses = useMemo(() => {
    const mockResponses = MOCK_RESPONSES[survey.id] || [];
    const imported = importedResponses[survey.id] || [];
    return [...mockResponses, ...imported];
  }, [survey.id, importedResponses]);

  const analyticsData = useMemo(() => {
    if (allResponses.length === 0) return null;

    const isProduct = survey.id === '4';
    const categoryField = isProduct ? 'pq1' : 'aq6';
    const scoreField = isProduct ? 'pq2' : 'aq4';
    const sentimentField = isProduct ? 'pq3' : '';

    const segmentCounts: Record<string, { total: number, sum: number, neg: number }> = {};
    const timelineMap: Record<string, number> = {};

    allResponses.forEach(r => {
      const segment = r.answers[categoryField] || 'Other';
      if (!segmentCounts[segment]) segmentCounts[segment] = { total: 0, sum: 0, neg: 0 };
      
      const rating = Number(r.answers[scoreField]) || 0;
      segmentCounts[segment].total++;
      segmentCounts[segment].sum += rating;
      if (r.answers[sentimentField] === 'Negative') segmentCounts[segment].neg++;

      const date = r.timestamp;
      timelineMap[date] = (timelineMap[date] || 0) + 1;
    });

    const categoryStats = Object.keys(segmentCounts).map(name => ({
      name,
      avg: (segmentCounts[name].sum / (segmentCounts[name].total || 1)).toFixed(1),
      count: segmentCounts[name].total
    }));

    const timeline = Object.keys(timelineMap).sort().map(date => ({
      displayDate: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      responses: timelineMap[date]
    })).slice(-15);

    return { categoryStats, timeline };
  }, [allResponses, survey]);

  useEffect(() => {
    if ((isViewer || isAnalyst) && !aiReport && allResponses.length > 0) {
      handleRunAI();
    }
  }, [isViewer, isAnalyst, aiReport, allResponses.length, survey.id]);

  const handleRunAI = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeSurveyData(survey, allResponses.slice(0, 50));
      setAiReport(result);
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV(allResponses.map(r => r.answers), `Analytics_${survey.title}`);
      setIsExporting(false);
    }, 800);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await ImportService.importFile(file, survey.id);
      setImportResult(result);
      
      if (result.success && result.data.length > 0) {
        // Register with consistency service
        DataConsistencyService.registerImportedData(
          survey.id,
          result.data,
          file.name,
          result.source || 'csv'
        );

        // Callback to parent
        onImportResponses(survey.id, result.data);
        
        // Reset AI report to re-analyze with new data
        setAiReport(null);
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

  if (!analyticsData) return <div className="p-8 text-center text-slate-500">Loading Analytics...</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 glass rounded-xl text-slate-400 hover:text-white border border-white/10">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{survey.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                {isAnalyst ? 'Full Analytics' : 'Executive View'}
              </span>
              <p className="text-slate-500 text-xs">{allResponses.length} Responses Analyzed</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleDownload} 
          disabled={isExporting}
          className="px-5 py-3 glass rounded-xl text-sm font-bold border border-white/5 flex items-center gap-2 hover:bg-white/5 transition-all disabled:opacity-50 text-white"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={18} />}
          Export Report
        </button>
        <button 
          onClick={handleImportClick}
          disabled={isImporting}
          className="px-5 py-3 glass rounded-xl text-sm font-bold border border-emerald-500/30 flex items-center gap-2 hover:bg-emerald-500/10 transition-all disabled:opacity-50 text-emerald-400"
        >
          {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={18} />}
          Import Data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Import Result Alert */}
      {importResult && (
        <div className={`p-4 rounded-xl border flex gap-3 ${
          importResult.success 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          {importResult.success ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-bold text-sm ${importResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>
              {importResult.success 
                ? `✓ Successfully imported ${importResult.rowsImported} rows`
                : `✕ Import failed with ${importResult.errors.length} error(s)`
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
          <button
            onClick={() => setImportResult(null)}
            className="text-slate-400 hover:text-white text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="glass p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-2">
                   <Activity size={18} className="text-brand-primary" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Consistency</span>
                </div>
                <div className="text-2xl font-bold text-white">0.92</div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mt-1">High</div>
             </div>
             <div className="glass p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-2">
                   <Users size={18} className="text-brand-accent" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Participants</span>
                </div>
                <div className="text-2xl font-bold text-white">{allResponses.length}</div>
                <div className="text-[10px] font-bold text-brand-accent uppercase tracking-wide mt-1">Active</div>
             </div>
             <div className="glass p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-2">
                   <Zap size={18} className="text-emerald-500" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Velocity</span>
                </div>
                <div className="text-2xl font-bold text-white">12/hr</div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mt-1">Trending Up</div>
             </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
               <BarChart3 size={20} className="text-brand-primary" /> Trend Analysis
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.timeline}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="responses" stroke="#6366f1" fillOpacity={1} fill="url(#colorArea)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] flex flex-col min-h-[500px]">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-brand-primary">
             <BrainCircuit size={20} /> AI Summary
          </h3>
          {isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="animate-spin text-brand-primary" size={40} />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analyzing Data...</p>
            </div>
          ) : aiReport ? (
             <div className="space-y-6 animate-in fade-in duration-700">
                <div className="p-5 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                   <span className="text-[10px] font-bold text-brand-primary uppercase block mb-2">Executive Summary</span>
                   <p className="text-sm text-slate-300 leading-relaxed font-medium">"{aiReport.summary}"</p>
                </div>
                
                <div className="space-y-3">
                   <span className="text-[10px] font-bold text-emerald-500 uppercase block mb-1">Key Recommendations</span>
                   {aiReport.recommendations.map((r, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 flex gap-3">
                         <TrendingUp size={14} className="text-emerald-500 shrink-0" /> {r}
                      </div>
                   ))}
                </div>

                <div className="space-y-3 pt-2">
                   <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">Areas for Improvement</span>
                   {aiReport.weakAreas.map((w, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 flex gap-3">
                         <AlertCircle size={14} className="text-rose-500 shrink-0" /> {w}
                      </div>
                   ))}
                </div>
             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
              <Sparkles size={48} className="text-slate-600" />
              <button onClick={handleRunAI} className="px-5 py-2 border border-brand-primary/20 rounded-xl text-xs font-bold text-brand-primary hover:bg-brand-primary/10 uppercase tracking-wider">Generate Insights</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
