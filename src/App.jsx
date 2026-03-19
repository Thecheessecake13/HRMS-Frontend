import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import EmployeeList from './components/EmployeeList';
import AttendanceMarking from './components/AttendanceMarking';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import ActivityLogPage from './components/ActivityLog';
import { fetchActivityLogs, fetchUnreadCount, markLogsRead } from './utils/api';

const tabs = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    id: 'employees', label: 'Employees',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    id: 'attendance', label: 'Attendance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>
      </svg>
    )
  },
  {
    id: 'reports', label: 'Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  },
  {
    id: 'activity', label: 'Activity Log',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  }
];

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const App = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Load latest 10 logs for the dropdown
  const loadNotifications = useCallback(async () => {
    try {
      const [logs, countData] = await Promise.all([
        fetchActivityLogs(10),
        fetchUnreadCount()
      ]);
      setNotifications(logs);
      setUnreadCount(countData.count);
    } catch {
      // silent fail — don't break the UI
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Keyboard shortcut: / to open search
  const handleKeyDown = useCallback((e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      setShowSearch(true);
    }
    if (e.key === 'Escape') {
      setShowSearch(false);
      setShowNotifications(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const markAllRead = async () => {
    try {
      await markLogsRead();
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch {
      // silent
    }
  };

  const quickNavItems = [
    { label: 'Go to Dashboard', tab: 'dashboard' },
    { label: 'Go to Employees', tab: 'employees' },
    { label: 'Go to Attendance', tab: 'attendance' },
    { label: 'Go to Reports', tab: 'reports' },
    { label: 'Go to Activity Log', tab: 'activity' },
  ];

  const filteredNav = searchQuery
    ? quickNavItems.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : quickNavItems;

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    if (id === 'activity') {
      markAllRead();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleTabClick} />;
      case 'employees': return <EmployeeList />;
      case 'attendance': return <AttendanceMarking />;
      case 'reports': return <Reports />;
      case 'activity': return <ActivityLogPage />;
      default: return <Dashboard onNavigate={handleTabClick} />;
    }
  };

  const notifIcon = (action) => {
    if (action === 'employee_created') return '👤';
    if (action === 'employee_deleted') return '🗑️';
    if (action === 'attendance_marked') return '📅';
    return '📊';
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-dark-900)]">

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Notification / Search overlay */}
      {(showNotifications || showSearch) && (
        <div className="fixed inset-0 z-[60]" onClick={() => { setShowNotifications(false); setShowSearch(false); setSearchQuery(''); }} />
      )}

      {/* Global search modal */}
      {showSearch && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-lg bg-[var(--color-dark-700)] border border-[var(--color-glass-border)] rounded-2xl shadow-2xl shadow-black/60 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-glass-border)]">
              <svg className="w-4 h-4 text-[var(--color-txt-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[var(--color-txt-muted)] outline-none"
                placeholder='Search pages… (Press Esc to close)'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <kbd className="text-[0.65rem] text-[var(--color-txt-muted)] bg-[var(--color-dark-600)] px-1.5 py-0.5 rounded font-mono">Esc</kbd>
            </div>
            <div className="py-2">
              {filteredNav.map(item => (
                <div
                  key={item.tab}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => { handleTabClick(item.tab); setShowSearch(false); setSearchQuery(''); }}
                >
                  <span className="text-xs text-[var(--color-txt-muted)] bg-[var(--color-dark-600)] px-2 py-0.5 rounded font-mono">Page</span>
                  <span className="text-sm text-white">{item.label}</span>
                </div>
              ))}
              {filteredNav.length === 0 && (
                <p className="text-sm text-[var(--color-txt-muted)] text-center py-4">No results for "{searchQuery}"</p>
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-[var(--color-glass-border)] flex items-center gap-4 text-[0.68rem] text-[var(--color-txt-muted)]">
              <span><kbd className="font-mono bg-[var(--color-dark-600)] px-1.5 py-0.5 rounded">↵</kbd> select</span>
              <span><kbd className="font-mono bg-[var(--color-dark-600)] px-1.5 py-0.5 rounded">Esc</kbd> close</span>
              <span className="ml-auto"><kbd className="font-mono bg-[var(--color-dark-600)] px-1.5 py-0.5 rounded">/</kbd> open</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 w-[260px] min-w-[260px]
        bg-[var(--color-dark-800)] border-r border-[var(--color-glass-border)]
        flex flex-col py-6 px-4 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 animate-slide-in-left' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/30" style={{ animation: 'pulse-ring 2.5s ease infinite' }}>
            H
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight block">HRMS Lite</span>
            <span className="text-[0.65rem] text-[var(--color-txt-muted)]">v2.0</span>
          </div>
        </div>

        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-txt-muted)] px-3 mb-3">Main Menu</p>
        <nav className="flex flex-col gap-1">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 select-none group relative
                ${activeTab === tab.id
                  ? 'bg-[var(--color-accent-light)] text-violet-400 font-semibold'
                  : 'text-[var(--color-txt-muted)] hover:text-[var(--color-txt-secondary)] hover:bg-white/[0.03]'}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {activeTab === tab.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
              )}
              <div className={`w-5 h-5 shrink-0 transition-colors ${activeTab === tab.id ? 'text-violet-400' : 'text-[var(--color-txt-muted)] group-hover:text-[var(--color-txt-secondary)]'}`}>
                {tab.icon}
              </div>
              <span className="text-[0.88rem]">{tab.label}</span>
              {tab.id === 'activity' && unreadCount > 0 && (
                <span className="ml-auto text-[0.6rem] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="mt-auto pt-4 border-t border-[var(--color-glass-border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">A</div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--color-txt-primary)] leading-tight">Admin</span>
              <span className="text-[0.7rem] text-[var(--color-txt-muted)]">Administrator</span>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title="Online" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 bg-[var(--color-dark-900)]/80 backdrop-blur-xl border-b border-[var(--color-glass-border)]">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 rounded-lg border border-[var(--color-glass-border)] flex items-center justify-center text-[var(--color-txt-secondary)] hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white capitalize">{activeTab === 'activity' ? 'Activity Log' : activeTab}</h1>
              <p className="text-xs text-[var(--color-txt-muted)] hidden sm:block">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-glass-border)] text-[var(--color-txt-muted)] hover:border-violet-500/30 hover:text-white transition-all text-xs"
              onClick={() => setShowSearch(true)}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <span>Search</span>
              <kbd className="ml-1 font-mono bg-[var(--color-dark-600)] px-1 py-0.5 rounded text-[0.6rem]">/</kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative w-9 h-9 rounded-lg border border-[var(--color-glass-border)] flex items-center justify-center text-[var(--color-txt-secondary)] hover:bg-white/5 hover:text-white transition-all"
                onClick={() => {
                  if (!showNotifications) {
                    setShowNotifications(true);
                    markAllRead();
                  } else {
                    setShowNotifications(false);
                    loadNotifications();
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-[var(--color-dark-700)] border border-[var(--color-glass-border)] rounded-2xl shadow-2xl shadow-black/50 z-[80] animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[0.6rem] font-bold bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors" onClick={markAllRead}>Mark all read</button>
                      )}
                      <button
                        className="text-xs text-[var(--color-txt-muted)] hover:text-white transition-colors"
                        onClick={() => { setShowNotifications(false); handleTabClick('activity'); }}
                      >
                        View all →
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--color-glass-border)] max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <span className="text-2xl opacity-40">🔔</span>
                        <p className="text-xs text-[var(--color-txt-muted)]">No activity yet</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${!n.read ? 'bg-violet-500/5' : ''}`}>
                          <span className="text-base mt-0.5">{notifIcon(n.action)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${!n.read ? 'text-white font-medium' : 'text-[var(--color-txt-secondary)]'}`}>{n.description}</p>
                            <p className="text-[0.68rem] text-[var(--color-txt-muted)] mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-glass-border)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-[var(--color-txt-secondary)] hidden sm:inline">Admin Panel</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
