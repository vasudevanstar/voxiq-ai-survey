
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, MicOff, CheckCircle2, ChevronLeft, Loader2, Sparkles, Volume2, History, BrainCircuit } from 'lucide-react';
import { Survey, User, Response } from '../types';
import { transcribeAudio, summarizeText } from '../services/geminiService';

interface SurveyTakerProps {
  surveyId: string | null;
  surveys: Survey[];
  user?: User;
  onClose: () => void;
  onSurveyComplete?: (surveyId: string, response: Response) => void;
}

export const SurveyTaker: React.FC<SurveyTakerProps> = ({ surveyId, surveys, user, onClose, onSurveyComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptionTargetRef = useRef<string | null>(null);

  const survey = surveys.find(s => s.id === surveyId) || surveys[0];

  const handleNext = () => {
    if (currentStep < survey.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Survey submitted - create response object
      const response: Response = {
        surveyId: survey.id,
        answers: answers,
        timestamp: new Date().toISOString(),
        sentiment: detectSentiment(answers),
        _importSource: 'viewer'
      };

      // Call the completion handler if provided
      if (onSurveyComplete && surveyId) {
        onSurveyComplete(surveyId, response);
      }

      setIsSubmitted(true);
    }
  };

  // Simple sentiment detection
  const detectSentiment = (answers: Record<string, string>): 'positive' | 'neutral' | 'negative' => {
    const text = Object.values(answers).join(' ').toLowerCase();
    const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', 'satisfied', 'best'];
    const negative = ['bad', 'poor', 'terrible', 'hate', 'unhappy', 'dissatisfied', 'worst'];

    let positiveCount = positive.filter(word => text.includes(word)).length;
    let negativeCount = negative.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      transcriptionTargetRef.current = survey.questions[currentStep].id;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const targetId = transcriptionTargetRef.current;
        if (targetId) {
          await handleTranscription(audioBlob, targetId);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Please enable microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob, targetId: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const text = await transcribeAudio(base64Audio);
        if (text) {
          const existingText = answers[targetId] || '';
          const fullText = existingText ? `${existingText} ${text}` : text;
          handleAnswerChange(targetId, fullText);
          
          const summary = await summarizeText(fullText);
          if (summary) {
            setSummaries(prev => ({ ...prev, [targetId]: summary }));
          }
        }
        setIsTranscribing(false);
        transcriptionTargetRef.current = null;
      };
    } catch (err) {
      console.error("Transcription failed", err);
      setIsTranscribing(false);
      transcriptionTargetRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  if (isSubmitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-in zoom-in-95 duration-700 min-h-screen">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <div className="text-center space-y-2 max-w-md relative z-10">
          <h2 className="text-3xl font-bold text-white">Thank You!</h2>
          <p className="text-slate-400">
            Your responses for <span className="text-brand-primary font-bold">"{survey.title}"</span> have been recorded.
          </p>
        </div>
        <button 
          onClick={onClose} 
          className="px-8 py-3 bg-brand-primary rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-indigo-500 transition-all text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = survey.questions[currentStep];
  const currentVal = answers[currentQuestion?.id] || '';
  const currentSummary = summaries[currentQuestion?.id] || '';

  return (
    <div className="flex-1 flex flex-col items-center p-8 lg:p-24 space-y-12 min-h-screen">
      {/* Progress Bar */}
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex justify-between items-center px-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-all py-2 px-3 hover:bg-white/5 rounded-lg"
          >
            <ChevronLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Exit</span>
          </button>
          <div className="text-right flex flex-col items-end">
             <span className="text-xs font-bold text-brand-primary truncate max-w-[200px]">{survey.title}</span>
          </div>
        </div>

        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full bg-brand-primary transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep + 1) / (survey.questions.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl w-full glass p-10 lg:p-16 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-white/5">
        <div className="flex justify-between items-center mb-12 relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold">
              {currentStep + 1}
            </span>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Question</span>
          </div>
        </div>

        <div className="space-y-12 relative z-10">
          <h2 className="text-3xl font-bold leading-tight text-white animate-in slide-in-from-left-2 duration-500">
            {currentQuestion?.title || "Evaluating..."}
          </h2>

          <div className="min-h-[200px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 delay-100">
            {currentQuestion?.type === 'RATING' && (
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button 
                    key={val} 
                    onClick={() => {
                      handleAnswerChange(currentQuestion.id, val.toString());
                      setTimeout(handleNext, 300);
                    }} 
                    className={`w-16 h-16 rounded-2xl glass border-white/5 hover:border-brand-primary hover:bg-brand-primary/10 text-xl font-bold transition-all text-white ${currentVal === val.toString() ? 'border-brand-primary bg-brand-primary/20' : ''}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}
            
            {currentQuestion?.type === 'MCQ' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {currentQuestion.options?.map((opt) => (
                  <button 
                    key={opt} 
                    onClick={() => {
                      handleAnswerChange(currentQuestion.id, opt);
                      setTimeout(handleNext, 300);
                    }} 
                    className={`p-6 rounded-2xl glass border-white/5 hover:border-brand-primary hover:bg-brand-primary/10 text-left font-medium transition-all text-white ${currentVal === opt ? 'border-brand-primary bg-brand-primary/20' : ''}`}
                  >
                    <span className="text-base">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion?.type === 'TEXT' && (
              <div className="w-full space-y-8">
                <div className="relative group/input">
                  <textarea 
                    value={currentVal}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[160px] outline-none focus:ring-1 focus:ring-brand-primary/50 transition-all text-white text-base leading-relaxed"
                    placeholder="Type or use microphone..."
                  />
                  {isTranscribing && (
                    <div className="absolute top-4 right-4 animate-spin text-brand-primary">
                      <Loader2 size={20} />
                    </div>
                  )}
                </div>

                {/* AI Summary Section */}
                {currentSummary && !isRecording && (
                  <div className="glass p-5 rounded-2xl border-brand-primary/20 bg-brand-primary/5 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-brand-primary" />
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{currentSummary}"
                    </p>
                  </div>
                )}

                <div className="flex justify-center">
                   <button 
                     onClick={toggleRecording}
                     disabled={isTranscribing}
                     className={`p-6 rounded-full transition-all shadow-xl disabled:opacity-50 relative group/mic ${
                       isRecording 
                         ? 'bg-rose-500 shadow-rose-500/30' 
                         : 'bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20'
                     }`}
                   >
                     {isRecording && (
                       <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20 pointer-events-none" />
                     )}
                     {isRecording ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-brand-primary" />}
                   </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-white/5">
            <button 
              onClick={handleBack}
              disabled={currentStep === 0 || isRecording}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all text-sm ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button 
              onClick={handleNext}
              disabled={isRecording || isTranscribing || (currentQuestion.required && !currentVal)}
              className="flex items-center gap-3 px-8 py-4 bg-brand-primary rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-indigo-500 transition-all active:scale-95 text-white disabled:opacity-50"
            >
              <span className="text-base">{currentStep === survey.questions.length - 1 ? 'Submit' : 'Next'}</span>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
