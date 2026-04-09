
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SurveyBuilder } from './components/SurveyBuilder';
import { SurveyTaker } from './components/SurveyTaker';
import { SurveysList } from './components/SurveysList';
import { ViewerSurveyList } from './components/ViewerSurveyList';
import { SurveyAnalytics } from './components/SurveyAnalytics';
import { Auth } from './components/Auth';
import { View, Survey, User, Response } from './types';
import { AI_INDICATORS, MOCK_SURVEYS, MOCK_ALERTS } from './constants';
import { Zap, Moon, Search, Bell, Maximize, Minimize, PanelLeftClose, PanelLeft, ShieldCheck, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [lastView, setLastView] = useState<View>('home');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>(MOCK_SURVEYS);
  const [importedResponses, setImportedResponses] = useState<Record<string, Response[]>>({});
  
  // Track viewer completed surveys & responses
  const [viewerCompletedSurveys, setViewerCompletedSurveys] = useState<Set<string>>(new Set());
  const [viewerResponses, setViewerResponses] = useState<Record<string, Response[]>>({});
  
  // Track open alerts for notification count
  const openAlertsCount = MOCK_ALERTS.filter(a => a.status === 'open').length;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const navigateTo = (view: View, surveyId?: string) => {
    // Role-based access control
    if (view === 'builder') {
      if (currentUser?.role === 'viewer') {
        alert("Access Denied: Viewers cannot create or edit surveys. This operation requires Creator or Admin role.");
        return;
      }
    }
    if (view === 'dashboard' && currentUser?.role === 'viewer') {
      alert("Viewer Role: You have read-only access to dashboards and insights.");
      return;
    }

    if (surveyId !== undefined) {
      setSelectedSurveyId(surveyId);
    } else if (view === 'builder' || view === 'home') {
      setSelectedSurveyId(null);
    }
    setLastView(currentView);
    setCurrentView(view);
  };

  const handleCreateNew = () => {
    setSelectedSurveyId(null);
    navigateTo('builder');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
  };

  const handleSaveSurvey = (updatedSurvey: Survey) => {
    setSurveys(prev => {
      const exists = prev.find(s => s.id === updatedSurvey.id);
      if (exists) {
        return prev.map(s => s.id === updatedSurvey.id ? updatedSurvey : s);
      }
      return [updatedSurvey, ...prev];
    });
    navigateTo('dashboard');
  };

  const handleImportResponses = (surveyId: string, responses: Response[]) => {
    setImportedResponses(prev => ({
      ...prev,
      [surveyId]: [...(prev[surveyId] || []), ...responses]
    }));
  };

  // Handle viewer survey completion
  const handleViewerSurveyComplete = (surveyId: string, response: Response) => {
    // Mark survey as completed for this viewer
    setViewerCompletedSurveys(prev => new Set([...prev, surveyId]));
    
    // Store viewer response
    setViewerResponses(prev => ({
      ...prev,
      [surveyId]: [...(prev[surveyId] || []), response]
    }));
    
    // Also add to importedResponses so admins/creators can see it
    setImportedResponses(prev => ({
      ...prev,
      [surveyId]: [...(prev[surveyId] || []), response]
    }));
  };

  const handleDeleteSurvey = (surveyId: string) => {
    if (currentUser?.role !== 'admin') {
      alert("Authorization Required: Only Administrators can delete surveys.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      if (selectedSurveyId === surveyId) {
        setSelectedSurveyId(null);
      }
    }
  };

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
  }

  const renderView = () => {
    // Viewer-specific experience
    if (currentUser.role === 'viewer') {
      switch (currentView) {
        case 'home':
        case 'dashboard':
          return (
            <ViewerSurveyList 
              user={currentUser}
              surveys={surveys}
              completedSurveys={viewerCompletedSurveys}
              onTakeSurvey={(id) => navigateTo('taker', id)}
            />
          );
        case 'taker':
          return (
            <SurveyTaker 
              surveyId={selectedSurveyId} 
              surveys={surveys}
              user={currentUser}
              onClose={() => navigateTo('home')}
              onSurveyComplete={handleViewerSurveyComplete}
            />
          );
        default:
          return (
            <ViewerSurveyList 
              user={currentUser}
              surveys={surveys}
              completedSurveys={viewerCompletedSurveys}
              onTakeSurvey={(id) => navigateTo('taker', id)}
            />
          );
      }
    }

    // Admin and Creator experience
    switch (currentView) {
      case 'home': 
        return <Dashboard user={currentUser} surveys={surveys} onViewAllSurveys={() => navigateTo('dashboard')} onLogout={handleLogout} />;
      case 'builder': 
        return (
          <SurveyBuilder 
            surveyId={selectedSurveyId} 
            onSave={handleSaveSurvey} 
            existingSurveys={surveys}
          />
        );
      case 'dashboard': 
        return (
          <SurveysList 
            user={currentUser}
            surveys={surveys}
            onEdit={(id) => navigateTo('builder', id)} 
            onViewAnalytics={(id) => navigateTo('analytics', id)} 
            onTake={(id) => navigateTo('taker', id)}
            onDelete={handleDeleteSurvey}
            onCreateNew={handleCreateNew}
            onImportResponses={handleImportResponses}
            importedResponses={importedResponses}
          />
        );
      case 'analytics':
        return (
          <SurveyAnalytics 
            surveyId={selectedSurveyId || (surveys.length > 0 ? surveys[0].id : '')} 
            onBack={() => navigateTo('dashboard')} 
            userRole={currentUser.role}
            onImportResponses={handleImportResponses}
            importedResponses={importedResponses}
          />
        );
      case 'taker': 
        return (
          <SurveyTaker 
            surveyId={selectedSurveyId} 
            surveys={surveys}
            onClose={() => navigateTo(lastView === 'taker' ? 'home' : lastView)} 
          />
        );
      default: 
        return <Dashboard user={currentUser} surveys={surveys} onViewAllSurveys={() => navigateTo('dashboard')} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-surface to-brand-dark text-slate-200 overflow-x-hidden">
      {currentView !== 'taker' && (
        <Sidebar 
          currentView={currentView} 
          onViewChange={(v) => navigateTo(v)} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userRole={currentUser.role}
        />
      )}
      
      <main className={`transition-all duration-300 ease-in-out min-h-screen flex flex-col ${
        currentView === 'taker' ? '' : isSidebarCollapsed ? 'pl-20' : 'pl-64'
      }`}>
        {currentView !== 'taker' && (
          <header className="h-20 border-b border-brand-primary/20 flex items-center justify-between px-8 sticky top-0 bg-gradient-to-r from-brand-dark/80 via-brand-surface/80 to-brand-dark/80 backdrop-blur-xl z-40 animate-fade-in">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 hover:bg-brand-primary/10 rounded-xl transition-all text-slate-400 hover:text-brand-primary lg:flex hidden hover:shadow-lg hover:shadow-brand-primary/20"
              >
                {isSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-lg border border-brand-primary/30 animate-slide-in-left">
                <ShieldCheck size={14} className={currentUser.role === 'viewer' ? 'text-brand-secondary' : 'text-brand-primary'} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                  {currentUser.role === 'viewer' ? 'Read-Only Access' : currentUser.role + ' Role'} Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden xl:flex gap-3 items-center mr-4">
                {AI_INDICATORS.map((indicator, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-brand-primary/5 rounded-lg border border-brand-primary/20 text-[10px] font-bold hover:border-brand-primary/50 hover:bg-brand-primary/10 transition-all hover:shadow-lg hover:shadow-brand-primary/10" style={{animationDelay: `${idx * 100}ms`}}>
                    {indicator.icon}
                    <span className="text-brand-accent uppercase tracking-tighter">{indicator.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-brand-primary/5 p-1 rounded-xl border border-brand-primary/20">
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 text-slate-400 hover:text-brand-primary transition-all rounded-lg hover:bg-brand-primary/10 hover:shadow-lg hover:shadow-brand-primary/20"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <button className="p-2 text-slate-400 hover:text-brand-secondary transition-all rounded-lg hover:bg-brand-secondary/10 hover:shadow-lg hover:shadow-brand-secondary/20">
                  <Moon size={20} />
                </button>
              </div>

              <button className="p-2 text-slate-400 hover:text-brand-secondary transition-all relative group hover:shadow-lg hover:shadow-brand-secondary/20 rounded-lg">
                <Bell size={20} />
                {openAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-r from-brand-secondary to-brand-accent text-[8px] font-bold text-white rounded-full border-2 border-brand-dark flex items-center justify-center animate-pulse-glow">
                    {openAlertsCount}
                  </span>
                )}
                {/* Tooltip for bell */}
                <div className="absolute top-full right-0 mt-2 w-48 glass p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl pointer-events-none animate-slide-in-up">
                  <p className="text-[10px] font-bold text-brand-accent uppercase mb-1">Risk Intelligence</p>
                  <p className="text-[9px] text-slate-400">{openAlertsCount} active risk anomalies detected.</p>
                </div>
              </button>
              
              <div className="h-8 w-[1px] bg-brand-primary/20 mx-1" />
              
              <div className="flex items-center gap-3 px-3 py-1.5 glass rounded-xl border border-brand-primary/20 hover:border-brand-primary/40 transition-all group animate-scale-in">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold text-white uppercase">{currentUser.name}</div>
                  <div className="text-[8px] text-brand-secondary font-bold uppercase tracking-tighter group-hover:text-brand-accent transition-colors">
                    {currentUser.role === 'viewer' ? 'Viewer' : currentUser.role === 'creator' ? 'Creator' : 'Admin'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-lg shadow-brand-primary/30 group-hover:shadow-brand-secondary/40 transition-all group-hover:scale-105">
                  <img src={currentUser.avatar} className="w-full h-full rounded-[7px] object-cover" alt="User" />
                </div>
              </div>
            </div>
          </header>
        )}

        <div className="relative flex-1">
          {renderView()}
        </div>

        {currentView !== 'taker' && (
          <footer className="py-8 border-t border-brand-primary/10 text-center text-slate-600 text-[10px] uppercase tracking-widest hover:text-brand-accent transition-colors animate-fade-in">
            <p>© 2026 Survey Sense Decision Intelligence Platform • Neural Link Synchronized</p>
          </footer>
        )}
      </main>
    </div>
  );
};

export default App;
