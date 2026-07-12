import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Download, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell, 
  ShieldAlert, 
  Sun, 
  Moon,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WaveBackground } from './WaveBackground';
import { CommandSearch } from './CommandSearch';
import toast from 'react-hot-toast';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  const notifications = [
    { id: 1, title: 'Device Guard Active', desc: 'Secure workspace sandbox verification completed.', time: 'Just now', type: 'info' },
    { id: 2, title: 'Welcome to Aura Academy', desc: 'Explore tech courses on TypeScript, Cloud Architectures, and Gemini AI.', time: '2h ago', type: 'system' },
    { id: 3, title: 'Account Status Verified', desc: 'Your profile has active privileges.', time: '1d ago', type: 'success' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Error logging out');
    }
  };

  const menuItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/downloads', label: 'Downloads', icon: Download },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const getPageHeader = () => {
    const path = location.pathname;
    if (path.startsWith('/home')) return 'Academic Dashboard';
    if (path.startsWith('/courses')) return 'Interactive Courses';
    if (path.startsWith('/course/')) return 'Course Overview';
    if (path.startsWith('/subject/')) return 'Subject Library';
    if (path.startsWith('/lecture/')) return 'Secure Media Player';
    if (path.startsWith('/downloads')) return 'Offline Assets';
    if (path.startsWith('/profile')) return 'Student Identity Profile';
    return 'Learning Hub';
  };

  const toggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    toast.success(`Switched to ${nextTheme === 'dark' ? 'Onyx Dark' : 'Quartz Light'} mode`, { id: 'theme-toast' });
  };

  return (
    <div className={`min-h-screen flex text-slate-100 font-sans relative select-none bg-[#05060b] text-slate-100`}>
      
      {/* Wave Background embedded behind layout */}
      <WaveBackground />

      {/* COMMAND-K SEARCH OVERLAY */}
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* MOBILE SIDEBAR DRAWERS OVERLAYS */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-[#05060b]/80 backdrop-blur-md z-30 lg:hidden"
        />
      )}

      {/* SIDEBAR NAVIGATION - GLASSMORPHIC LIQUID DRAWERS */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 border-r border-white/10 z-40 flex flex-col justify-between p-6 transition-all duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 bg-white/10 backdrop-blur-3xl' : '-translate-x-full lg:translate-x-0 bg-white/5 backdrop-blur-2xl'
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Brand/Logo Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                A
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wider text-white">AURA</h1>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Academy</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Stats Guard badge - "Device Shield" style */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Device Shield</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-xs font-medium text-white/80">Secure Session</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group border ${
                      isActive 
                        ? 'bg-white/10 border-white/10 text-indigo-400 font-bold shadow-lg' 
                        : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={16} className="transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {user?.role === 'admin' && (
              <a
                href="/web/admin.html"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group border text-indigo-400 hover:text-white hover:bg-indigo-600/10 border-transparent hover:border-indigo-500/20"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="text-sm">🛡️</span>
                <span>Admin Panel</span>
              </a>
            )}
          </nav>
        </div>

        {/* User Info & Logout drawer footer */}
        <div className="flex flex-col gap-4 border-t border-white/10 pt-5">
          {user && (
            <div className="flex items-center gap-3 p-1.5 rounded-xl bg-white/5 border border-white/10">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
                alt={user.name} 
                className="w-8 h-8 rounded-full border border-white/20 object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                <p className="text-[10px] text-white/40 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Theme & Logout Options */}
          <div className="flex gap-2">
            <button 
              onClick={toggleTheme}
              className="flex-1 flex justify-center items-center p-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition border border-white/10 text-xs font-semibold gap-1.5"
              title="Toggle Theme Preset"
            >
              {themeMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">Theme</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 flex justify-center items-center p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/10 text-xs font-semibold gap-1.5"
              title="End Academic Session"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT AND HEADERS */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* TOP BAR APPNAV */}
        <header className="sticky top-0 p-4 border-b border-white/10 flex items-center justify-between z-30 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5 border border-white/10"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white">{getPageHeader()}</h2>
              <p className="text-[10px] text-white/40 hidden sm:block">Aura Academic Platform Portal</p>
            </div>
          </div>

          {/* Quick Access Actions Bar */}
          <div className="flex items-center gap-3 relative">
            {/* Realtime Search Launcher */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition text-white/60 hover:text-white text-xs min-w-[120px] md:min-w-[180px]"
            >
              <Search size={14} />
              <span className="flex-1 text-left hidden sm:inline">Search academic content...</span>
              <kbd className="hidden md:inline bg-white/5 border border-white/10 px-1 rounded font-mono text-[9px] text-white/40">⌘K</kbd>
            </button>

            {/* Notifications Alert Center */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white/60 hover:text-white relative`}
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              </button>

              {/* Notification dropdown card */}
              {isNotificationsOpen && (
                <>
                  <div 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="fixed inset-0 z-10" 
                  />
                  <div className="absolute right-0 mt-2.5 w-80 bg-[#0a0c12]/95 border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-xl z-20 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bell size={12} className="text-indigo-400" />
                        Platform Alerts
                      </span>
                      <span className="text-[9px] text-indigo-400 font-bold bg-white/10 px-2 py-0.5 rounded-full">3 alerts</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {notifications.map(n => (
                        <div key={n.id} className="flex gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="p-1.5 bg-white/5 rounded-lg text-indigo-400 h-fit">
                            <ShieldAlert size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[10px] font-bold text-white truncate">{n.title}</h5>
                            <p className="text-[9px] text-white/60 mt-0.5">{n.desc}</p>
                            <span className="text-[8px] text-white/40 block mt-1 font-mono">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Laptop diagnostic state badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold">
              <Laptop size={12} />
              <span>Diagnostic Sync: Active</span>
            </div>
          </div>
        </header>

        {/* PAGE DYNAMIC CONTENT VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto z-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
