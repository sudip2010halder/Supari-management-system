import React from 'react';
import { Home, Users, PlusCircle, BarChart3, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';

export type View = 'dashboard' | 'clients' | 'entry' | 'reports' | 'settings' | 'about';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'entry', icon: PlusCircle, label: 'Add' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = (id: View) => {
    hapticFeedback.light();
    onViewChange(id);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFBF7] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <div className="max-w-md mx-auto p-4 md:p-6 lg:max-w-lg">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-primary/5 dark:border-stone-800 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-24 px-8">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              id={`nav-btn-${id}`}
              key={id}
              onClick={() => handleNavClick(id as View)}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300",
                activeView === id 
                  ? "text-primary dark:text-[#4ADE80] scale-110" 
                  : "text-accent opacity-40 hover:opacity-80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl mb-1.5 flex items-center justify-center transition-colors shadow-sm",
                activeView === id ? "bg-primary text-white" : "bg-transparent"
              )}>
                <Icon size={24} strokeWidth={activeView === id ? 3 : 2} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                activeView === id ? "opacity-100" : "opacity-70"
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
