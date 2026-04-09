
import React, { useState } from 'react';
import { Search, Edit3, BarChart2, Trash2, ExternalLink, Play, Plus, Sparkles, Lock, Eye, Upload, FileCheck, Loader2 } from 'lucide-react';
import { Survey, User, Response } from '../types';
import { MOCK_RESPONSES } from '../constants';
import { ImportModal } from './ImportModal';

interface SurveysListProps {
  user: User;
  surveys: Survey[];
  onEdit: (surveyId: string) => void;
  onViewAnalytics: (surveyId: string) => void;
  onTake: (surveyId: string) => void;
  onDelete: (surveyId: string) => void;
  onCreateNew: () => void;
  onImportResponses: (surveyId: string, responses: Response[]) => void;
  importedResponses: Record<string, Response[]>;
}

export const SurveysList: React.FC<SurveysListProps> = ({ user, surveys, onEdit, onViewAnalytics, onTake, onDelete, onCreateNew, onImportResponses, importedResponses }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const isAdmin = user.role === 'admin';
  const isAnalyst = user.role === 'analyst' || isAdmin;
  const isViewer = user.role === 'researcher';

  const handleImportComplete = (responses: Response[]) => {
    const surveyId = responses[0]?.surveyId;
    if (surveyId) {
      onImportResponses(surveyId, responses);
    }
    setIsImportModalOpen(false);
  };

  const getTotalResponses = (surveyId: string) => {
    const mockCount = MOCK_RESPONSES[surveyId]?.length || 0;
    const importedCount = importedResponses[surveyId]?.length || 0;
    return mockCount + importedCount;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-right">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">My Surveys</h2>
            <span className="px-2 py-1 bg-brand-primary/10 text-brand-accent text-[10px] rounded-md font-bold uppercase tracking-wider border border-brand-primary/30">
              {surveys.length} Active
            </span>
          </div>
          <p className="text-slate-400 text-sm">Manage and analyze your active data collection campaigns.</p>
        </div>
        <div className="flex items-center gap-3 animate-slide-in-up">
          {isAnalyst && (
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm font-bold border border-brand-primary/30 hover:bg-brand-primary/10 hover:border-brand-primary/50 transition-all text-brand-accent disabled:opacity-50 hover:shadow-lg hover:shadow-brand-primary/20"
            >
              <Upload size={18} />
              Import Data
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={onCreateNew}
              className="flex items-center gap-2 px-5 py-2.5 btn-gradient rounded-xl text-sm font-bold transition-all"
            >
              <Plus size={18} />
              New Survey
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {surveys.map((survey) => {
          const responseCount = getTotalResponses(survey.id);

          return (
            <div key={survey.id} className="glass p-8 rounded-3xl group hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden animate-bounce-in" style={{animationDelay: `${surveys.indexOf(survey) * 50}ms`}}>
              <div className="flex items-start gap-6 flex-1">
                <div className={`p-4 rounded-2xl transition-all group-hover:shadow-lg ${survey.status === 'active' ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 group-hover:bg-brand-primary/30 group-hover:shadow-brand-primary/20' : 'bg-slate-500/10 text-slate-400 border border-slate-700/30'}`}>
                  {survey.status === 'active' ? <FileCheck size={24} /> : <Edit3 size={24} />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{survey.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${survey.status === 'active' ? 'border-brand-primary/50 text-brand-accent bg-brand-primary/10 group-hover:border-brand-primary/80' : 'border-slate-500/30 text-slate-400'}`}>
                      {survey.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-1 max-w-2xl">{survey.description}</p>
                  <div className="flex items-center gap-6 pt-2 text-[11px] font-medium text-slate-500">
                    <span>{survey.questions.length} Questions</span>
                    <span>{responseCount} Responses</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-brand-primary/20 pt-6 lg:pt-0 lg:pl-8">
                <button 
                  onClick={() => onTake(survey.id)}
                  className="flex items-center gap-2 px-5 py-2.5 btn-gradient rounded-xl text-sm font-bold transition-all"
                >
                  <Play size={16} fill="currentColor" /> Preview
                </button>
                
                {(isAnalyst || isViewer) ? (
                   <button 
                    onClick={() => onViewAnalytics(survey.id)}
                    className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm font-bold text-slate-300 hover:text-brand-accent border border-brand-primary/20 hover:border-brand-primary/50 hover:bg-brand-primary/10 transition-all hover:shadow-lg hover:shadow-brand-primary/20"
                   >
                    {isViewer ? <Eye size={18} /> : <BarChart2 size={18} />} 
                    {isViewer ? 'View Report' : 'Analytics'}
                   </button>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2.5 text-slate-600 grayscale opacity-50 cursor-not-allowed">
                    <Lock size={14} /> Locked
                  </div>
                )}

                {isAdmin && (
                  <>
                    <button onClick={() => onEdit(survey.id)} className="p-3 hover:bg-brand-primary/10 rounded-xl text-slate-500 hover:text-brand-primary transition-all hover:shadow-lg hover:shadow-brand-primary/20">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(survey.id); }} className="p-3 hover:bg-brand-secondary/10 rounded-xl text-slate-500 hover:text-brand-secondary transition-all hover:shadow-lg hover:shadow-brand-secondary/20">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        surveys={surveys}
      />
    </div>
  );
};
