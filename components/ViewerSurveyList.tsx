import React, { useState } from 'react';
import { Play, Clock, CheckCircle2, AlertCircle, ChevronRight, Search, Sparkles } from 'lucide-react';
import { Survey, User } from '../types';
import { MOCK_RESPONSES } from '../constants';

interface ViewerSurveyListProps {
  user: User;
  surveys: Survey[];
  completedSurveys: Set<string>;
  onTakeSurvey: (surveyId: string) => void;
}

export const ViewerSurveyList: React.FC<ViewerSurveyListProps> = ({ user, surveys, completedSurveys, onTakeSurvey }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         survey.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isCompleted = completedSurveys.has(survey.id);
    const statusMatch = filterStatus === 'all' ? true : 
                       filterStatus === 'active' ? !isCompleted :
                       isCompleted;

    return matchesSearch && statusMatch && survey.status === 'active';
  });

  const activeSurveyCount = surveys.filter(s => s.status === 'active').length;
  const completedCount = completedSurveys.size;

  return (
    <div className="p-10 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Available Surveys
          </h2>
          <p className="text-slate-400 text-sm">
            Share your insights by participating in our surveys. Your responses help us make better decisions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-6 rounded-2xl border border-brand-primary/20 hover:border-brand-primary/40 transition-all hover:shadow-lg hover:shadow-brand-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Available Surveys</p>
                <p className="text-3xl font-bold text-brand-primary mt-1">{activeSurveyCount}</p>
              </div>
              <Sparkles size={32} className="text-brand-primary/30" />
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-brand-secondary/20 hover:border-brand-secondary/40 transition-all hover:shadow-lg hover:shadow-brand-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Completed</p>
                <p className="text-3xl font-bold text-brand-secondary mt-1">{completedCount}</p>
              </div>
              <CheckCircle2 size={32} className="text-brand-secondary/30" />
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-brand-accent/20 hover:border-brand-accent/40 transition-all hover:shadow-lg hover:shadow-brand-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Pending</p>
                <p className="text-3xl font-bold text-brand-accent mt-1">{activeSurveyCount - completedCount}</p>
              </div>
              <Clock size={32} className="text-brand-accent/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search surveys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-primary/5 border border-brand-primary/30 rounded-xl pl-12 pr-5 py-3 outline-none focus:border-brand-primary focus:bg-brand-primary/10 transition-all text-white placeholder-slate-500 text-sm focus:shadow-lg focus:shadow-brand-primary/20"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'active', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg'
                  : 'bg-brand-primary/5 border border-brand-primary/30 text-slate-400 hover:bg-brand-primary/10 hover:border-brand-primary/50'
              }`}
            >
              {status === 'all' ? 'All' : status === 'active' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Surveys Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredSurveys.length === 0 ? (
          <div className="lg:col-span-2 glass p-16 rounded-3xl text-center border border-brand-primary/20">
            <AlertCircle size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">No surveys found</h3>
            <p className="text-slate-500 text-sm">Check back later for new surveys to participate in.</p>
          </div>
        ) : (
          filteredSurveys.map((survey, idx) => {
            const responseCount = MOCK_RESPONSES[survey.id]?.length || 0;
            const isCompleted = completedSurveys.has(survey.id);

            return (
              <div
                key={survey.id}
                className="glass p-8 rounded-3xl border border-brand-primary/20 hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary/20 transition-all group overflow-hidden animate-bounce-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Survey Header */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-2xl font-bold text-white group-hover:text-brand-primary transition-colors">
                        {survey.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {survey.description}
                      </p>
                    </div>
                    {isCompleted && (
                      <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">Completed</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-brand-primary/20 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total Questions</span>
                      <span className="font-bold text-brand-primary">{survey.questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Community Responses</span>
                      <span className="font-bold text-brand-accent">{responseCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Est. Time</span>
                      <span className="font-bold text-brand-secondary">
                        {Math.ceil(survey.questions.length * 1.5)} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onTakeSurvey(survey.id)}
                  disabled={isCompleted}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn ${
                    isCompleted
                      ? 'bg-slate-700/30 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:shadow-xl hover:shadow-brand-primary/30 active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={18} />
                      Survey Complete
                    </>
                  ) : (
                    <>
                      <Play size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      Take Survey
                      <ChevronRight size={18} className="ml-auto group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Message */}
      <div className="glass p-8 rounded-2xl border border-brand-primary/20 text-center">
        <p className="text-sm text-slate-400">
          Your responses are valuable to us. Every survey you complete helps us gather better insights.
          <br />
          <span className="text-brand-accent font-semibold">Thank you for participating!</span>
        </p>
      </div>
    </div>
  );
};
