import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Settings2, Save, Sparkles, ChevronDown, LayoutTemplate, X, Check, Eye, ChevronRight, ListPlus, Wand2, Star, MessageSquareText, ListFilter, CheckCircle2, Copy, Eraser, Mic, MicOff, Loader2, Volume2, BrainCircuit, History, Search, Layers, ArrowRight, PlusCircle } from 'lucide-react';
import { QuestionType, Question, Survey } from '../types';
import { SURVEY_TEMPLATES, SurveyTemplate } from '../constants';
import { summarizeText } from '../services/geminiService';
import { VoiceRecognitionService } from '../services/voiceRecognitionService';

interface SurveyBuilderProps {
  surveyId: string | null;
  onSave: (survey: Survey) => void;
  existingSurveys: Survey[];
}

const DRAFT_KEY = 'surveylens_builder_draft';

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ surveyId, onSave, existingSurveys }) => {
  const [title, setTitle] = useState('Untitled Survey');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  
  // Voice Recording State
  const [activeRecordingField, setActiveRecordingField] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Simulation Lab State
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, string>>({});
  const [simulatedSummaries, setSimulatedSummaries] = useState<Record<string, string>>({});

  useEffect(() => {
    if (surveyId) {
      const existing = existingSurveys.find(s => s.id === surveyId);
      if (existing) {
        setTitle(existing.title);
        setDescription(existing.description);
        setQuestions(existing.questions);
      }
    } else {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setTitle(draft.title || 'Untitled Survey');
          setDescription(draft.description || '');
          setQuestions(draft.questions || []);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [surveyId, existingSurveys]);

  useEffect(() => {
    if (!surveyId) {
      const timeout = setTimeout(() => {
        const draftData = { title, description, questions };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [title, description, questions, surveyId]);

  const clearDraft = useCallback(() => {
    if (window.confirm("Are you sure you want to clear this draft?")) {
      setTitle('Untitled Survey');
      setDescription('');
      setQuestions([]);
      setSimulatedAnswers({});
      setSimulatedSummaries({});
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const handleStartRecording = async (fieldId: string) => {
    try {
      setIsTranscribing(true);
      setRecordingTime(0);

      // Record audio with optimized settings
      const audioBlob = await VoiceRecognitionService.recordAudioOptimized(30, {
        sampleRate: 16000,
        enableAutoPunctuation: true,
      });

      // Show recording progress
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          // Use fast transcription for immediate feedback
          const text = await VoiceRecognitionService.transcribeFast(base64Audio, {
            enableAutoPunctuation: true,
            language: 'en',
          });

          if (text) {
            // Update the appropriate field
            if (fieldId === 'survey-title') setTitle(text);
            else if (fieldId === 'survey-desc') setDescription(text);
            else if (fieldId.startsWith('desc-')) {
              const qId = fieldId.replace('desc-', '');
              setQuestions((prev) =>
                prev.map((q) => (q.id === qId ? { ...q, description: text } : q))
              );
            } else if (fieldId.startsWith('sim-')) {
              const qId = fieldId.replace('sim-', '');
              setSimulatedAnswers((prev) => ({ ...prev, [qId]: text }));
              const summary = await summarizeText(text);
              if (summary) {
                setSimulatedSummaries((prev) => ({ ...prev, [qId]: summary }));
              }
            } else {
              setQuestions((prev) =>
                prev.map((q) => (q.id === fieldId ? { ...q, title: text } : q))
              );
            }
          }
        } catch (error) {
          console.error('Transcription error:', error);
          alert('Transcription failed. Please try again.');
        } finally {
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
          }
          setIsTranscribing(false);
          setRecordingTime(0);
          setActiveRecordingField(null);
        }
      };
    } catch (err) {
      console.error('Mic access denied', err);
      alert('Please enable microphone access.');
      setIsTranscribing(false);
      setActiveRecordingField(null);
    }
  };

  const handleStopRecording = () => {
    VoiceRecognitionService.stopRecording();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const toggleRecording = (fieldId: string) => {
    if (activeRecordingField === fieldId) {
      handleStopRecording();
    } else {
      handleStartRecording(fieldId);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: type === QuestionType.TEXT ? 'Feedback question' : 'New Question',
      description: '',
      required: true,
      options: type === QuestionType.MCQ || type === QuestionType.LIKERT ? ['Option 1', 'Option 2'] : undefined
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const importQuestion = (templateQuestion: Omit<Question, 'id'>) => {
    const newQuestion: Question = {
      ...templateQuestion,
      id: Math.random().toString(36).substr(2, 9)
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const applyTemplate = (template: SurveyTemplate) => {
    if (questions.length > 0 && !window.confirm("Applying a template will replace your current questions. Proceed?")) {
      return;
    }
    setTitle(template.title);
    setDescription(template.description);
    const newQuestions = template.questions.map(q => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setQuestions(newQuestions);
    setIsTemplateModalOpen(false);
  };

  const handleSave = () => {
    const survey: Survey = {
      id: surveyId || Math.random().toString(36).substr(2, 9),
      title,
      description,
      questions,
      creatorId: 'current-user',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    localStorage.removeItem(DRAFT_KEY);
    onSave(survey);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-32 relative text-slate-200">
      
      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-sm" onClick={() => setIsTemplateModalOpen(false)} />
          <div className="glass w-full max-w-6xl h-full max-h-[85vh] rounded-3xl overflow-hidden flex flex-col relative z-10 shadow-2xl border-white/10">
            <div className="flex justify-between items-center p-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary rounded-xl">
                  <LayoutTemplate className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Template Library</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Select a baseline survey</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-3 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-80 border-r border-white/5 overflow-y-auto p-6 space-y-4 bg-white/[0.02]">
                <div className="relative mb-6">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input placeholder="Search templates..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none text-slate-300 focus:border-brand-primary" />
                </div>
                
                {SURVEY_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${selectedTemplate?.id === tpl.id ? 'bg-brand-primary/20 ring-1 ring-brand-primary/50' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`p-2.5 rounded-xl transition-all ${selectedTemplate?.id === tpl.id ? 'bg-brand-primary text-white' : 'bg-white/5 text-slate-400'}`}>
                        {tpl.icon}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${selectedTemplate?.id === tpl.id ? 'text-white' : 'text-slate-300'}`}>{tpl.title}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{tpl.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-white/[0.01]">
                {selectedTemplate ? (
                  <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-start gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                           <span className="px-3 py-1 bg-brand-primary rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">Preview</span>
                           <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{selectedTemplate.questions.length} Questions</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white">{selectedTemplate.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">{selectedTemplate.description}</p>
                      </div>
                      <button 
                        onClick={() => applyTemplate(selectedTemplate)}
                        className="flex items-center gap-3 px-8 py-4 bg-brand-primary rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 text-white"
                      >
                        Use Template
                        <ArrowRight size={18} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Questions</h5>
                      {selectedTemplate.questions.map((q, i) => (
                        <div key={i} className="glass p-6 rounded-2xl border-white/5 hover:border-white/10 transition-all flex items-center justify-between group/qpreview">
                          <div className="flex items-start gap-6">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 border border-white/5">
                              {i + 1}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-200">{q.title}</span>
                                <span className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-wider">{q.type}</span>
                              </div>
                              {q.options && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {q.options.map((opt, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-bold rounded-md">{opt}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => importQuestion(q)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-[10px] font-bold text-slate-300 opacity-0 group-hover/qpreview:opacity-100 transition-all hover:bg-white/10 border border-white/10 uppercase tracking-wider"
                          >
                            <Plus size={14} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                    <div className="p-8 bg-white/5 rounded-full">
                      <Layers size={48} className="text-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-400">Select a Template</h3>
                      <p className="text-sm text-slate-600">Choose a starting point from the library.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center sticky top-0 bg-[#0f172a]/95 backdrop-blur-md z-30 py-4 -mx-8 px-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Plus className="text-white" size={18} />
          </div>
          <h2 className="text-xl font-bold">{surveyId ? 'Edit Survey' : 'New Survey'}</h2>
        </div>
        <div className="flex gap-2">
          {!surveyId && (
            <button 
              onClick={clearDraft}
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm hover:bg-rose-500/10 transition-all text-rose-400 font-medium border border-rose-500/20"
            >
              <Eraser size={16} />
              Reset
            </button>
          )}
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm hover:bg-white/10 transition-all text-brand-primary font-medium border border-brand-primary/20"
          >
            <LayoutTemplate size={16} />
            Templates
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-brand-primary rounded-lg text-sm font-bold shadow-lg shadow-brand-primary/20 hover:bg-indigo-500 transition-all text-white"
          >
            <Save size={16} />
            {surveyId ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Title Card */}
      <div className="glass p-10 rounded-3xl space-y-10 relative overflow-hidden group border-white/5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Survey Title</span>
            {isTranscribing && activeRecordingField === 'survey-title' && (
              <div className="flex items-center gap-2 text-brand-primary text-[10px] font-bold animate-pulse">
                <Loader2 size={12} className="animate-spin" /> Transcribing...
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 group/title">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`bg-transparent border-b border-white/10 text-3xl font-bold flex-1 outline-none focus:border-brand-primary transition-all placeholder-slate-600 text-white py-2 ${activeRecordingField === 'survey-title' ? 'text-rose-400 border-rose-500/40' : ''}`}
              placeholder="Enter survey title"
            />
            <button 
              onClick={() => toggleRecording('survey-title')}
              className={`p-3 rounded-xl transition-all ${
                activeRecordingField === 'survey-title' 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-white/5 text-slate-500 hover:text-brand-primary hover:bg-white/10'
              }`}
            >
              {activeRecordingField === 'survey-title' ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</span>
          <div className="flex items-start gap-4 group/desc">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`bg-transparent border-b border-white/10 text-slate-400 flex-1 outline-none focus:border-brand-primary transition-all resize-none h-20 leading-relaxed py-2 ${activeRecordingField === 'survey-desc' ? 'text-indigo-300 border-indigo-500/40' : ''}`}
              placeholder="Describe your survey..."
            />
            <button 
              onClick={() => toggleRecording('survey-desc')}
              className={`p-3 rounded-xl transition-all mt-2 ${
                activeRecordingField === 'survey-desc' 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-white/5 text-slate-500 hover:text-brand-primary hover:bg-white/10'
              }`}
            >
              {activeRecordingField === 'survey-desc' ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 glass border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-brand-primary/50 transition-all group" onClick={() => setIsTemplateModalOpen(true)}>
            <div className="p-6 bg-white/5 rounded-full text-slate-600 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
              <PlusCircle size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-400">No questions yet</p>
              <p className="text-sm text-slate-600">Add a question below or use a template</p>
            </div>
          </div>
        )}
        
        {questions.map((q, idx) => (
          <div key={q.id} className={`glass p-8 rounded-3xl group relative hover:border-white/10 transition-all border-white/5 ${activeRecordingField === q.id ? 'border-rose-500/30' : ''}`}>
            <div className="flex items-start gap-6">
              <div className="cursor-move text-slate-700 pt-2 transition-colors group-hover:text-slate-500">
                <GripVertical size={20} />
              </div>
              <div className="flex-1 space-y-8">
                <div className="flex justify-between items-start gap-8">
                  <div className="flex-1 space-y-4 relative group/qheader">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Question {idx + 1}</span>
                    </div>
                    
                    {/* Title Input */}
                    <div className="relative group/titleinput">
                      <input 
                        value={q.title}
                        onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                        className={`w-full bg-transparent border-b border-white/10 pb-2 text-xl outline-none focus:border-brand-primary transition-all text-white font-bold pr-12 ${activeRecordingField === q.id ? 'text-rose-400 border-rose-500/40' : ''}`}
                        placeholder="Question text"
                      />
                      <div className="absolute right-0 top-0 flex items-center h-full gap-3">
                        {isTranscribing && activeRecordingField === q.id && <Loader2 size={16} className="animate-spin text-brand-primary" />}
                        <button 
                          onClick={() => toggleRecording(q.id)}
                          className={`p-2 rounded-lg transition-all ${
                            activeRecordingField === q.id 
                              ? 'bg-rose-500 text-white animate-pulse' 
                              : 'text-slate-500 hover:text-brand-primary hover:bg-white/5 opacity-0 group-hover/titleinput:opacity-100'
                          }`}
                        >
                          {activeRecordingField === q.id ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-slate-400 flex items-center gap-2 h-fit border border-white/5 uppercase tracking-wider">
                    {q.type}
                  </div>
                </div>

                {/* Question Specific UI */}
                {q.type === QuestionType.TEXT ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <div className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-md text-[8px] font-bold uppercase tracking-wider">
                          Test Response
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           Simulate Answer
                        </label>
                        
                        <div className="relative group/siminput">
                          <textarea 
                            value={simulatedAnswers[q.id] || ''}
                            onChange={(e) => setSimulatedAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className={`w-full bg-[#0f172a]/40 border border-white/10 rounded-xl p-4 min-h-[80px] outline-none focus:ring-1 focus:ring-brand-primary/50 transition-all text-slate-300 text-sm pr-12 ${activeRecordingField === `sim-${q.id}` ? 'ring-1 ring-rose-500/30 border-rose-500/30' : ''}`}
                            placeholder="Type or record a test answer..."
                          />
                          <div className="absolute right-3 top-3 flex flex-col items-center gap-2">
                            <button 
                              onClick={() => toggleRecording(`sim-${q.id}`)}
                              className={`p-2 rounded-lg transition-all ${
                                activeRecordingField === `sim-${q.id}` 
                                  ? 'bg-rose-500 text-white animate-pulse' 
                                  : 'text-slate-500 hover:text-brand-primary hover:bg-white/5'
                              }`}
                            >
                              {activeRecordingField === `sim-${q.id}` ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Summary Preview */}
                      {simulatedSummaries[q.id] && (
                        <div className="p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20 animate-in zoom-in-95 duration-300 space-y-2">
                           <div className="flex items-center gap-2">
                             <Sparkles size={12} className="text-brand-primary" />
                             <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">AI Summary</span>
                           </div>
                           <p className="text-xs text-slate-300 leading-relaxed italic">
                             "{simulatedSummaries[q.id]}"
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : q.type === QuestionType.RATING ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 ml-4">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Test Rating Simulation
                        </label>
                        <span className="text-[10px] text-slate-600">Range: 1 - 5</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input 
                          type="number"
                          value={simulatedAnswers[q.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setSimulatedAnswers(prev => ({ ...prev, [q.id]: val }));
                              return;
                            }
                            const num = parseInt(val);
                            if (!isNaN(num) && num >= 1 && num <= 5) {
                              setSimulatedAnswers(prev => ({ ...prev, [q.id]: val }));
                            }
                          }}
                          className="bg-[#0f172a]/40 border border-white/10 rounded-xl px-4 py-3 w-24 outline-none focus:ring-1 focus:ring-brand-primary/50 transition-all text-white text-sm font-bold text-center"
                          placeholder="-"
                        />
                        <div className="h-8 w-[1px] bg-white/10 mx-2" />
                        <div className="flex gap-2">
                           {[1, 2, 3, 4, 5].map(r => (
                             <button
                               key={r}
                               onClick={() => setSimulatedAnswers(prev => ({ ...prev, [q.id]: r.toString() }))}
                               className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${simulatedAnswers[q.id] === r.toString() ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:scale-105'}`}
                             >
                               {r}
                             </button>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : q.options && (
                  <div className="space-y-3 ml-4">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3 group/opt">
                        <div className="w-5 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <input 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])];
                            newOpts[i] = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }}
                          className="bg-transparent border-none text-sm outline-none focus:ring-0 text-slate-300 w-full hover:text-white transition-colors"
                          placeholder={`Option ${i+1}`}
                        />
                        <button 
                          onClick={() => {
                             const newOpts = q.options?.filter((_, idx) => idx !== i);
                             updateQuestion(q.id, { options: newOpts });
                          }}
                          className="opacity-0 group-hover/opt:opacity-100 p-1.5 text-slate-600 hover:text-rose-400 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                        updateQuestion(q.id, { options: newOpts });
                      }}
                      className="text-[10px] text-brand-primary font-bold hover:text-indigo-400 ml-8 uppercase tracking-wider flex items-center gap-2 pt-2 transition-colors"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button 
                  onClick={() => removeQuestion(q.id)} 
                  className="p-3 text-slate-600 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        <div className="flex justify-center pt-8">
          <div className="glass-light p-3 rounded-full flex flex-wrap justify-center gap-3 border border-white/5 relative">
            {[
              { type: QuestionType.TEXT, label: 'Text', icon: <MessageSquareText size={16} /> },
              { type: QuestionType.MCQ, label: 'Multiple Choice', icon: <ListPlus size={16} /> },
              { type: QuestionType.RATING, label: 'Rating', icon: <Star size={16} /> },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => addQuestion(btn.type)}
                className="px-5 py-3 hover:bg-brand-primary rounded-full text-xs font-bold text-slate-400 hover:text-white transition-all border border-transparent hover:border-brand-primary/50 flex items-center gap-3 uppercase tracking-wider group"
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};