
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  isCollapsed, 
  onToggleCollapse,
  userRole
}) => {
  const filteredNavItems = NAV_ITEMS.filter(item => {
    // Viewer - read-only access, only survey taking
    if (userRole === 'viewer') {
      // Hide builder, show only home/dashboard which displays surveys to take
      return item.id === 'home' || item.id === 'dashboard';
    }
    // Creator - full access except admin functions
    if (userRole === 'creator') {
      return true;
    }
    // Admin - full access
    return true;
  });

  return (
    <aside className={`h-screen glass border-r border-brand-primary/20 flex flex-col p-6 fixed left-0 top-0 z-50 transition-all duration-300 bg-brand-dark/95 backdrop-blur-xl ${
      isCollapsed ? 'w-24' : 'w-72'
    }`}>
      <div className={`flex items-center gap-4 mb-12 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
        <div 
          onClick={onToggleCollapse}
          className="w-12 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/30 cursor-pointer hover:shadow-xl hover:shadow-brand-secondary/40 transition-all hover:scale-105 animate-bounce-in"
        >
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent tracking-tight animate-slide-in-right">VoxIQ</h1>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {filteredNavItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-300 group ${
              currentView === item.id 
                ? 'bg-gradient-to-r from-brand-primary/80 to-brand-secondary/80 text-white shadow-lg shadow-brand-primary/30 font-medium hover:shadow-xl' 
                : 'text-slate-400 hover:bg-brand-primary/10 hover:text-brand-accent hover:border hover:border-brand-primary/30'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            style={{animationDelay: `${idx * 50}ms`}}
          >
            <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <span className={`transition-all group-hover:scale-125 ${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-brand-accent'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">{item.label}</span>
              )}
            </div>
            {!isCollapsed && currentView === item.id && <ChevronRight size={16} className="animate-pulse" />}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-brand-primary/20">
        <div className={`flex items-center gap-3 px-2 py-2 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary animate-pulse" />
          {!isCollapsed && <span className="text-[10px] font-medium text-brand-accent uppercase tracking-wider animate-pulse">System Online</span>}
        </div>
      </div>
    </aside>
  );
};
