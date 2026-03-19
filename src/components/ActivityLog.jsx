import React, { useState, useEffect, useCallback } from 'react';
import { fetchActivityLogs } from '../utils/api';

const ACTION_CONFIG = {
  employee_created: {
    label: 'Employee Added',
    icon: '👤',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    pill: 'bg-emerald-500/15 text-emerald-400'
  },
  employee_deleted: {
    label: 'Employee Removed',
    icon: '🗑️',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    pill: 'bg-red-500/15 text-red-400'
  },
  attendance_marked: {
    label: 'Attendance Marked',
    icon: '📅',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    pill: 'bg-violet-500/15 text-violet-400'
  }
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const FILTERS = [
  { id: 'all', label: 'All Activity' },
  { id: 'employee_created', label: 'Added' },
  { id: 'employee_deleted', label: 'Removed' },
  { id: 'attendance_marked', label: 'Attendance' }
];

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchActivityLogs(200);
      setLogs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // re-tick every 30s so relative timestamps update
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Activity Log</h2>
          <p className="text-sm text-[var(--color-txt-muted)] mt-0.5">
            Full audit trail of every action performed in the system
          </p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-glass-border)] text-[var(--color-txt-muted)] hover:text-white hover:border-violet-500/40 transition-all text-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: logs.length, color: 'text-white' },
          { label: 'Employees Added', value: logs.filter(l => l.action === 'employee_created').length, color: 'text-emerald-400' },
          { label: 'Employees Removed', value: logs.filter(l => l.action === 'employee_deleted').length, color: 'text-red-400' },
          { label: 'Attendance Events', value: logs.filter(l => l.action === 'attendance_marked').length, color: 'text-violet-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] rounded-xl px-4 py-3">
            <p className="text-[0.7rem] text-[var(--color-txt-muted)] font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filter === f.id
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                : 'bg-[var(--color-dark-700)] text-[var(--color-txt-muted)] border-[var(--color-glass-border)] hover:text-white hover:border-white/20'
            }`}
          >
            {f.label}
            {f.id !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({logs.filter(l => l.action === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--color-txt-muted)]">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={load} className="text-xs text-violet-400 hover:text-violet-300 underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl opacity-40">📋</span>
            <p className="text-sm font-medium text-[var(--color-txt-muted)]">No activity found</p>
            <p className="text-xs text-[var(--color-txt-muted)] opacity-60">
              {filter === 'all' ? 'Actions you take will appear here.' : 'No events match this filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header — desktop only */}
            <div className="hidden xl:grid grid-cols-[40px_1fr_160px_100px_90px] gap-4 px-5 py-3 border-b border-[var(--color-glass-border)]">
              {['', 'Description', 'Performed By', 'Type', 'Time'].map(h => (
                <span key={h} className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-txt-muted)]">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-[var(--color-glass-border)]">
              {filtered.map(log => {
                const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.attendance_marked;
                return (
                  <div
                    key={log._id}
                    className={`flex flex-col xl:grid xl:grid-cols-[40px_1fr_160px_100px_90px] gap-2 xl:gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${!log.read ? 'bg-violet-500/[0.03]' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`hidden xl:flex w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} items-center justify-center text-sm shrink-0`}>
                      {cfg.icon}
                    </div>

                    {/* Description */}
                    <div className="flex items-center gap-2 xl:gap-0 min-w-0">
                      <span className={`xl:hidden w-6 h-6 rounded-md ${cfg.bg} flex items-center justify-center text-xs shrink-0`}>{cfg.icon}</span>
                      <p className={`text-sm leading-relaxed ${!log.read ? 'text-white font-medium' : 'text-[var(--color-txt-secondary)]'}`}>
                        {log.description}
                      </p>
                    </div>

                    {/* Performed by */}
                    <div className="flex items-center gap-1.5 pl-8 xl:pl-0">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[0.55rem] font-bold shrink-0">A</div>
                      <span className="text-xs text-[var(--color-txt-muted)]">{log.performedBy}</span>
                    </div>

                    {/* Type pill */}
                    <div className="pl-8 xl:pl-0 flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${cfg.pill}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="pl-8 xl:pl-0 flex items-center">
                      <span className="text-[0.72rem] text-[var(--color-txt-muted)]" title={new Date(log.createdAt).toLocaleString()}>
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
