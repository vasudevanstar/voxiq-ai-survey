import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Zap, Loader2, Fingerprint, Activity, Eye, Lightbulb } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const ROLE_INFO = {
  admin: {
    title: 'Admin Login',
    description: 'System owner & controller',
    icon: <ShieldCheck size={20} />,
    color: 'from-red-500 to-pink-600',
    access: [
      'Manage users and roles',
      'View all surveys & analytics',
      'Set alert thresholds',
      'Receive critical notifications',
      'Download reports'
    ]
  },
  creator: {
    title: 'Survey Creator Login',
    description: 'Data collector & survey manager',
    icon: <Activity size={20} />,
    color: 'from-blue-500 to-cyan-600',
    access: [
      'Create & customize surveys',
      'Share survey links',
      'View live responses',
      'Access basic analytics'
    ]
  },
  viewer: {
    title: 'Viewer Login',
    description: 'Decision-maker / stakeholder',
    icon: <Eye size={20} />,
    color: 'from-purple-500 to-indigo-600',
    access: [
      'View dashboards & insights',
      'See trends, charts & AI recommendations',
      'Read-only access to data',
      'Cannot edit surveys or raw data'
    ]
  }
};

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'creator' | 'viewer' | null>(null);
  const [showDetails, setShowDetails] = useState<'admin' | 'creator' | 'viewer' | null>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      alert('Please select a login type');
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      const rolePermissions: Record<string, string[]> = {
        admin: ['manage-users', 'view-all-surveys', 'manage-alerts', 'download-reports', 'access-critical-notifications'],
        creator: ['create-surveys', 'share-surveys', 'view-responses', 'basic-analytics'],
        viewer: ['view-dashboards', 'view-insights', 'read-only-access']
      };

      const mockUser: User = {
        id: `u-${Math.random().toString(36).substr(2, 9)}`,
        name: email.split('@')[0] || 'Demo User',
        email: email || `${selectedRole}@surveysense.ai`,
        role: selectedRole,
        avatar: `https://picsum.photos/seed/${email}/80/80`,
        permissions: rolePermissions[selectedRole]
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-brand-dark via-brand-surface to-brand-dark relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-brand-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left: Role Selection */}
        <div className="glass p-10 rounded-3xl shadow-2xl border border-brand-primary/30 hover:border-brand-primary/50 transition-all animate-bounce-in">
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-brand-primary/40 hover:shadow-2xl hover:shadow-brand-secondary/40 transition-all hover:scale-110">
                <Zap className="text-white" size={32} fill="currentColor" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent tracking-tight">Survey Sense</h1>
              <p className="text-brand-accent/80 text-sm font-medium">AI-Powered Decision Intelligence</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-brand-accent tracking-wider">Select Login Type</label>
                
                <div className="grid grid-cols-1 gap-3">
                  {(['admin', 'creator', 'viewer'] as const).map((role) => {
                    const info = ROLE_INFO[role];
                    const isSelected = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowDetails(null);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left group ${
                          isSelected
                            ? `bg-gradient-to-r ${info.color} border-white/50 shadow-lg`
                            : 'bg-brand-primary/5 border-brand-primary/20 hover:border-brand-primary/50 hover:bg-brand-primary/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-white/20' : 'bg-brand-primary/20 group-hover:bg-brand-primary/40'}`}>
                              {info.icon}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{info.title}</div>
                              <div className="text-xs opacity-75 mt-0.5">{info.description}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDetails(showDetails === role ? null : role);
                            }}
                            className="text-xs font-bold opacity-70 hover:opacity-100 transition-opacity"
                          >
                            {showDetails === role ? '−' : '+'}
                          </button>
                        </div>
                        {showDetails === role && (
                          <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                            {info.access.map((item, idx) => (
                              <div key={idx} className="text-xs opacity-80 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-brand-accent tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work Email"
                  className="w-full bg-brand-primary/5 border border-brand-primary/30 rounded-xl px-5 py-4 outline-none focus:border-brand-primary focus:bg-brand-primary/10 transition-all text-white placeholder-slate-500 text-sm font-medium focus:shadow-lg focus:shadow-brand-primary/20"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading || !selectedRole}
                className="w-full py-4 btn-gradient rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-2xl"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-6 pt-2 text-brand-accent/50 hover:text-brand-accent transition-colors animate-pulse">
              <ShieldCheck size={18} />
              <Fingerprint size={18} />
            </div>
          </div>
        </div>

        {/* Right: Role Details */}
        <div className="space-y-6 animate-slide-in-right">
          {selectedRole && (
            <>
              <div className={`glass p-8 rounded-3xl border-2 bg-gradient-to-br ${ROLE_INFO[selectedRole].color} border-white/20 shadow-2xl`}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {ROLE_INFO[selectedRole].icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{ROLE_INFO[selectedRole].title}</h2>
                    <p className="text-sm text-white/80 mt-1">{ROLE_INFO[selectedRole].description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-white/70">Access & Permissions:</p>
                  {ROLE_INFO[selectedRole].access.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-white/90">
                      <Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-brand-primary/30 space-y-3">
                <p className="text-xs font-bold uppercase text-brand-accent">Purpose</p>
                <p className="text-sm text-slate-300">
                  {selectedRole === 'admin' && 'Ensures security, control, and system governance with comprehensive oversight.'}
                  {selectedRole === 'creator' && 'Separates data collection from decision-making, enabling efficient survey management.'}
                  {selectedRole === 'viewer' && 'Protects data integrity and supports fast decision-making with read-only insights.'}
                </p>
              </div>
            </>
          )}

          {!selectedRole && (
            <div className="glass p-8 rounded-3xl border border-brand-primary/30 h-full flex flex-col items-center justify-center text-center space-y-4">
              <Eye size={48} className="text-brand-primary/50" />
              <div>
                <h3 className="text-lg font-bold text-slate-400">Select a Login Type</h3>
                <p className="text-sm text-slate-500 mt-2">Choose your role to view detailed access levels and permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
