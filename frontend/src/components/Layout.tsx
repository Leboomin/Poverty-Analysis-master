import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  FileText,
  BarChart3,
  Map,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors",
      isActive ? "bg-primary text-white" : "text-on-surface/70 hover:bg-surface-container"
    )}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

const BottomNavItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => cn(
      "flex min-w-0 flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
      isActive ? "text-primary" : "text-on-surface/40"
    )}
  >
    <Icon size={18} />
    <span className="truncate text-[9px] font-bold uppercase tracking-wide">{label.split(' ')[0]}</span>
  </NavLink>
);

const THEME_STORAGE_KEY = 'poverty-insights-theme';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-low border-r border-outline-variant flex-col p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-display font-bold">P</div>
          <span className="font-display font-bold text-lg tracking-tight">POVERTY INSIGHTS</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
          <SidebarItem icon={Database} label="Datasets" to="/dataset-explorer" />
          <SidebarItem icon={BarChart3} label="Analytics" to="/analytics" />
          <SidebarItem icon={Map} label="Map View" to="/map" />
          <SidebarItem icon={MessageSquare} label="Talk to the Data" to="/talk-to-data" />
          <SidebarItem icon={FileText} label="Methodology" to="/methodology" />
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="mb-4 flex w-full items-center justify-between rounded-lg bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-28 lg:pb-0 lg:ml-64">
        <div className="p-6 pb-10 lg:p-12 max-w-7xl mx-auto w-full">
          <div className="mb-6 flex justify-end lg:hidden">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
          {children}
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="fixed bottom-0 left-0 right-0 h-14 bg-surface-container-low border-t border-outline-variant flex items-center justify-around px-1 lg:hidden z-40 glass-panel">
          <BottomNavItem icon={LayoutDashboard} label="Dashboard" to="/" />
          <BottomNavItem icon={Database} label="Datasets" to="/dataset-explorer" />
          <BottomNavItem icon={BarChart3} label="Analytics" to="/analytics" />
          <BottomNavItem icon={Map} label="Map" to="/map" />
          <BottomNavItem icon={MessageSquare} label="Talk" to="/talk-to-data" />
          <BottomNavItem icon={FileText} label="Method" to="/methodology" />
        </nav>
      </main>
    </div>
  );
};
