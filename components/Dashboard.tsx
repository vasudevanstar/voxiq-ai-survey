
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Activity, Download, Loader2, BrainCircuit, ShieldAlert, Zap, BellRing, Target as TargetIcon, RefreshCw, Shield, Users, Layers } from 'lucide-react';
import { MOCK_RESPONSES, MOCK_ALERTS } from '../constants';
import { Survey, User, RiskAlert } from '../types';
import { exportToCSV } from '../services/exportService';
import { generateRiskAlerts } from '../services/geminiService';

const COLORS = ['#00d9ff', '#ff006e', '#00f5ff', '#ff1493'];

interface DashboardProps {
  user: User;
  surveys: Survey[];
  onViewAllSurveys: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, surveys, onViewAllSurveys, onLogout }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [alerts, setAlerts] = useState<RiskAlert[]>(MOCK_ALERTS);
  const [isScanning, setIsScanning] = useState(false);

  const canManageUsers = user.role === 'admin';
  const canCreateSurveys = user.role === 'admin' || user.role === 'creator';
  const isViewerRole = user.role === 'viewer';
  
  const handleDownloadReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const productRes = MOCK_RESPONSES['4'] || [];
      exportToCSV(productRes.map(r => ({
        ...r.answers,
        timestamp: r.timestamp
      })), 'VoxIQ_Analytics_Export');
      setIsExporting(false);
    }, 1000);
  };

  const handleScanRisks = async () => {
    setIsScanning(true);
    try {
      // Simulate grabbing the latest "incoming" stream
      // We take a random slice of 20 responses to simulate a new batch
      const surveyId = '4'; // Default to the main E-comm survey for demo
      const responses = MOCK_RESPONSES[surveyId] || [];
      const start = Math.floor(Math.random() * (responses.length - 20));
      const incomingBatch = responses.slice(start, start + 20);
      
      const surveyContext = surveys.find(s => s.id === surveyId)?.description || "E-commerce feedback stream";

      const newRisks = await generateRiskAlerts(surveyContext, incomingBatch);
      
      const alertsWithMeta: RiskAlert[] = newRisks.map(risk => ({
        ...risk,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        status: 'open' as const,
        type: risk.type as any // Cast string to union type
      }));

      setAlerts(prev => [...alertsWithMeta, ...prev]);
    } catch (error) {
      console.error("Risk scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  const { stats, velocityData, sentimentData, categoryPerformance } = useMemo(() => {
    const productRes = MOCK_RESPONSES['4'] || [];
    const totalReviews = productRes.length;
    
    const monthMap: Record<string, number> = {};
    productRes.forEach(r => {
      const month = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    
    const velocity = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({
      name: m,
      responses: monthMap[m] || 0,
    }));

    const pos = productRes.filter(r => r.answers['pq3'] === 'Positive').length;
    const neu = productRes.filter(r => r.answers['pq3'] === 'Neutral').length;
    const neg = productRes.filter(r => r.answers['pq3'] === 'Negative').length;

    const sentiment = [
      { name: 'POS', value: Math.round((pos/totalReviews)*100) || 0 },
      { name: 'NEU', value: Math.round((neu/totalReviews)*100) || 0 },
      { name: 'NEG', value: Math.round((neg/totalReviews)*100) || 0 },
    ];

    const cats = ['Logistics', 'Hardware', 'Cloud', 'Retail'];
    const catStats = cats.map(cat => {
      const catRes = productRes.filter(r => r.answers['pq1'] === cat);
      const catAvg = catRes.reduce((acc, r) => acc + (Number(r.answers['pq2']) || 0), 0) / (catRes.length || 1);
      return {
        name: cat,
        avg: catAvg.toFixed(1),
        trend: catAvg > 3.8 ? 'rising' : 'at-risk'
      };
    });

    const openRiskCount = alerts.filter(a => a.status === 'open').length;

    // Role-specific stats
    const baseStats = [
      { label: 'Total Responses', value: totalReviews.toLocaleString(), icon: <Activity className="text-brand-primary" />, color: 'indigo', show: true },
      { label: 'AI Accuracy', value: '99.2%', icon: <BrainCircuit className="text-brand-primary" />, color: 'indigo', show: !isViewerRole },
      { label: 'Avg Latency', value: '142ms', icon: <Zap className="text-brand-accent" />, color: 'indigo', show: !isViewerRole },
      { label: 'Active Risks', value: openRiskCount.toString(), icon: <ShieldAlert className="text-brand-secondary" />, color: 'rose', show: !isViewerRole },
    ];

    let dashboardStats = baseStats.filter(s => s.show);

    // Add role-specific stats
    if (user.role === 'admin') {
      dashboardStats.push({ label: 'Active Users', value: '127', icon: <Users className="text-blue-400" />, color: 'blue', show: true });
      dashboardStats.push({ label: 'System Health', value: '98.5%', icon: <Shield className="text-green-400" />, color: 'green', show: true });
    }
    if (user.role === 'creator') {
      dashboardStats.push({ label: 'My Surveys', value: surveys.length.toString(), icon: <Layers className="text-purple-400" />, color: 'purple', show: true });
    }

    return { 
      stats: dashboardStats, 
      velocityData: velocity, 
      sentimentData: sentiment,
      categoryPerformance: catStats,
    };
  }, [alerts, user.role, surveys.length]);

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));
  };

  const getRoleBadge = () => {
    const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      admin: { label: 'Admin', color: 'from-red-500 to-pink-600', icon: <Shield size={14} /> },
      creator: { label: 'Creator', color: 'from-blue-500 to-cyan-600', icon: <Layers size={14} /> },
      viewer: { label: 'Viewer', color: 'from-purple-500 to-indigo-600', icon: <Activity size={14} /> }
    };
    const config = roleConfig[user.role];
    return { ...config };
  };

  return (
    <div className="p-10 space-y-10 animate-fade-in">
      {/* Top Header with Role Badge */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 animate-slide-in-right">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Dashboard
            </h2>
            <div className={`bg-gradient-to-r ${getRoleBadge().color} px-4 py-1.5 rounded-full flex items-center gap-2`}>
              {getRoleBadge().icon}
              <span className="text-xs font-bold text-white">{getRoleBadge().label}</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {user.role === 'admin' && 'System-wide oversight and governance controls.'}
            {user.role === 'creator' && 'Manage surveys and monitor live responses.'}
            {user.role === 'viewer' && 'Executive overview of insights and trends.'}
          </p>
        </div>
        <div className="flex items-center gap-4 animate-slide-in-up">
          {!isViewerRole && (
            <button 
              onClick={handleDownloadReport}
              disabled={isExporting}
              className="px-6 py-3 btn-gradient rounded-xl transition-all text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export Data
            </button>
          )}
          <button 
            onClick={onLogout}
            className="px-6 py-3 btn-gradient-pink rounded-xl transition-all text-sm font-bold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-8 rounded-3xl hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary/20 transition-all transform hover:scale-105 hover:-translate-y-1 group animate-bounce-in" style={{animationDelay: `${i * 100}ms`}}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/30 group-hover:bg-brand-primary/20 group-hover:border-brand-primary/50 transition-all group-hover:shadow-lg group-hover:shadow-brand-primary/20">
                {stat.icon}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-brand-accent bg-clip-text text-transparent">{stat.value}</div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider group-hover:text-brand-accent transition-colors">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-slide-in-up">
        {/* Risk Feed - Hidden from Viewers */}
        {!isViewerRole && (
          <div className="xl:col-span-1 glass p-8 rounded-[2.5rem] flex flex-col space-y-8 border-brand-primary/20 hover:border-brand-primary/40 transition-all">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BellRing size={20} className="text-brand-secondary animate-pulse" /> Risk Feed
                </h3>
                <p className="text-xs text-brand-accent/70 mt-1">Real-time anomaly stream</p>
              </div>
              {user.role === 'admin' && (
                <button 
                  onClick={handleScanRisks}
                  disabled={isScanning}
                  className="p-2 bg-brand-primary/10 rounded-lg hover:bg-brand-primary/30 hover:text-brand-primary hover:shadow-lg hover:shadow-brand-primary/20 transition-all text-slate-400"
                  title="Scan for Risks"
                >
                  <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px]">
              {alerts.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No active risks detected. System nominal.
                </div>
              )}
              {alerts.map((alert, idx) => (
                <div key={alert.id} className={`p-6 border rounded-2xl transition-all space-y-3 animate-slide-in-left hover:shadow-lg ${alert.status === 'resolved' ? 'bg-white/[0.01] border-slate-700/30 opacity-50' : 'bg-brand-secondary/5 border-brand-secondary/30 hover:border-brand-secondary/50 hover:shadow-brand-secondary/20'}`} style={{animationDelay: `${idx * 50}ms`}}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${alert.severity === 'High' ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/40' : alert.severity === 'Medium' ? 'bg-brand-accent/80 text-brand-dark' : 'bg-brand-primary text-white'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-bold text-brand-accent uppercase">{alert.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2">{alert.type}</h4>
                      <span className="text-[10px] text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed bg-brand-dark/50 p-3 rounded-lg border border-brand-primary/20">
                     {alert.rootCause}
                  </p>

                  {alert.status === 'open' && user.role !== 'viewer' && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                        <Zap size={10} /> Rec: {alert.action}
                      </div>
                      <button 
                        onClick={() => handleResolveAlert(alert.id)}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Charts - Full width for viewers */}
        <div className={`${isViewerRole ? 'xl:col-span-3' : 'xl:col-span-2'} space-y-8`}>
          <div className="glass p-8 rounded-[2.5rem] border-brand-primary/20 hover:border-brand-primary/40 transition-all hover:shadow-lg hover:shadow-brand-primary/10 animate-slide-in-up">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity size={20} className="text-brand-primary animate-float" /> 
                  Response Volume
                </h3>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00d9ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#151932', border: '1px solid #00d9ff', borderRadius: '12px', boxShadow: '0 0 20px rgba(0, 217, 255, 0.2)' }} />
                  <Area type="monotone" dataKey="responses" stroke="#00d9ff" strokeWidth={3} fillOpacity={1} fill="url(#colorMain)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass p-8 rounded-[2.5rem] border-brand-primary/20 hover:border-brand-primary/40 transition-all hover:shadow-lg hover:shadow-brand-primary/10 animate-slide-in-left">
                <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-6">Category Performance</h3>
                <div className="space-y-4">
                  {categoryPerformance.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/20 hover:border-brand-primary/50 hover:bg-brand-primary/10 transition-all hover:shadow-lg hover:shadow-brand-primary/20 group" style={{animationDelay: `${idx * 50}ms`}}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.trend === 'rising' ? 'bg-brand-primary/20 text-brand-primary group-hover:bg-brand-primary/40' : 'bg-brand-secondary/20 text-brand-secondary group-hover:bg-brand-secondary/40'} transition-all`}>
                           <TargetIcon size={18} />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">{cat.name}</div>
                           <div className="text-[10px] text-slate-500 font-medium">{cat.avg} / 5.0</div>
                        </div>
                      </div>
                      <div className={`text-[10px] font-bold uppercase transition-all group-hover:scale-110 ${cat.trend === 'rising' ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                         {cat.trend}
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="glass p-8 rounded-[2.5rem] border-brand-primary/20 hover:border-brand-primary/40 transition-all hover:shadow-lg hover:shadow-brand-primary/10 flex flex-col items-center animate-slide-in-right">
                <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-6 w-full">Sentiment Distribution</h3>
                <div className="h-48 w-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {sentimentData.map((_, index) => <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent animate-pulse">{sentimentData[0].value}%</span>
                     <span className="text-[9px] text-brand-accent uppercase tracking-widest">Positive</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
