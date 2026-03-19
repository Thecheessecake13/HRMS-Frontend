import React, { useState, useEffect, useCallback } from 'react';
import { fetchEmployees, fetchAttendance, fetchAttendanceByDate, markAttendance } from '../utils/api';

const AttendanceMarking = () => {
  const [employees, setEmployees] = useState([]);
  
  // Tab control: 'daily' | 'history'
  const [activeTab, setActiveTab] = useState('daily');
  
  // Daily View State
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(true);

  // History View State
  const [selectedEmp, setSelectedEmp] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [empSearch, setEmpSearch] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Initial load
  useEffect(() => {
    fetchEmployees().then(data => {
      setEmployees(data);
      if (data.length > 0) setSelectedEmp(data[0].employeeId);
    });
  }, []);

  // Fetch Daily Records
  const loadDailyRecords = useCallback(async () => {
    if (!dailyDate) return;
    try {
      setLoadingDaily(true);
      const data = await fetchAttendanceByDate(dailyDate);
      setDailyRecords(data);
    } catch (e) {
      showToast('Completed fetch', 'error');
    } finally {
      setLoadingDaily(false);
    }
  }, [dailyDate]);

  useEffect(() => {
    if (activeTab === 'daily') loadDailyRecords();
  }, [activeTab, loadDailyRecords]);

  // Fetch History Records
  useEffect(() => {
    if (activeTab === 'history' && selectedEmp) {
      setLoadingHistory(true);
      fetchAttendance(selectedEmp)
        .then(setHistoryRecords)
        .catch(() => showToast('Failed to fetch attendance history', 'error'))
        .finally(() => setLoadingHistory(false));
    }
  }, [selectedEmp, activeTab]);

  const handleQuickDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setDailyDate(d.toISOString().split('T')[0]);
  };

  const markDailyStatus = async (employeeId, status) => {
    try {
      // Optimistic upate
      setDailyRecords(prev => {
        const existing = prev.find(r => r.employeeId === employeeId);
        if (existing) {
          return prev.map(r => r.employeeId === employeeId ? { ...r, status } : r);
        }
        return [...prev, { employeeId, date: dailyDate, status, _id: Date.now().toString() }];
      });
      
      await markAttendance({ employeeId, date: dailyDate, status });
      // Reload to ensure sync
      loadDailyRecords();
    } catch (err) {
      showToast(err.message || 'Error marking attendance', 'error');
      loadDailyRecords();
    }
  };

  // --- Render Helpers ---
  const presentCount = dailyRecords.filter(r => r.status === 'Present').length;
  const absentCount = dailyRecords.filter(r => r.status === 'Absent').length;

  const totalHistoryDays = historyRecords.length;
  const historyPresentDays = historyRecords.filter(r => r.status === 'Present').length;
  const attendanceRate = totalHistoryDays > 0 ? Math.round((historyPresentDays / totalHistoryDays) * 100) : 0;

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(empSearch.toLowerCase()) || 
    e.employeeId.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-glass-border)] pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Marking</h2>
          <p className="text-sm text-[var(--color-txt-muted)] mt-1">Track and manage employee attendance</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] rounded-xl p-1 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'daily' 
                ? 'bg-[var(--color-dark-600)] shadow-md text-white' 
                : 'text-[var(--color-txt-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'history' 
                ? 'bg-[var(--color-dark-600)] shadow-md text-white' 
                : 'text-[var(--color-txt-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            Employee History
          </button>
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider">Select Date</label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] rounded-xl px-4 py-2 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <button onClick={() => handleQuickDate(-1)} className="text-xs bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] hover:bg-[var(--color-dark-700)] px-3 py-2 rounded-lg transition-colors">Yesterday</button>
                <button onClick={() => handleQuickDate(0)} className="text-xs bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] hover:bg-[var(--color-dark-700)] px-3 py-2 rounded-lg transition-colors">Today</button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div>
                  <div className="text-[0.65rem] text-[var(--color-txt-muted)] uppercase tracking-wider font-semibold">Present</div>
                  <div className="text-lg font-bold leading-none mt-0.5">{presentCount}</div>
                </div>
              </div>
              <div className="bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <div>
                  <div className="text-[0.65rem] text-[var(--color-txt-muted)] uppercase tracking-wider font-semibold">Absent</div>
                  <div className="text-lg font-bold leading-none mt-0.5">{absentCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden relative">
            {loadingDaily && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-glass-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-glass-border)] bg-[var(--color-dark-800)]/50">
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider w-32">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider w-32">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider text-right w-48">Mark Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-glass-border)]">
                  {employees.map(emp => {
                    const record = dailyRecords.find(r => r.employeeId === emp.employeeId);
                    const currentStatus = record ? record.status : null;
                    const initial = emp.name.charAt(0).toUpperCase();

                    return (
                      <tr key={emp.employeeId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-md shrink-0">
                              {initial}
                            </div>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-mono text-[var(--color-txt-muted)]">{emp.employeeId}</td>
                        <td className="px-5 py-4">
                          {currentStatus === 'Present' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-emerald-bg)] text-[var(--color-emerald-text)] border border-[var(--color-emerald)]/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Present
                            </span>
                          )}
                          {currentStatus === 'Absent' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-rose-bg)] text-[var(--color-rose-text)] border border-[var(--color-rose)]/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Absent
                            </span>
                          )}
                          {!currentStatus && (
                            <span className="text-xs font-medium text-[var(--color-txt-muted)] bg-[var(--color-dark-600)] px-2 py-1 rounded-md border border-[var(--color-glass-border)]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => markDailyStatus(emp.employeeId, 'Present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                currentStatus === 'Present' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' 
                                  : 'bg-[var(--color-dark-800)] border-[var(--color-glass-border)] text-[var(--color-txt-muted)] hover:text-emerald-400 hover:border-emerald-500/30'
                              }`}
                            >
                              ✓ Present
                            </button>
                            <button
                              onClick={() => markDailyStatus(emp.employeeId, 'Absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                currentStatus === 'Absent' 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]' 
                                  : 'bg-[var(--color-dark-800)] border-[var(--color-glass-border)] text-[var(--color-txt-muted)] hover:text-rose-400 hover:border-rose-500/30'
                              }`}
                            >
                              ✕ Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-slide-up">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider mb-2">Search Employee</h3>
              
              {/* Custom Search Bar filter as requested by user */}
              <div className="glass-card p-4 space-y-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-txt-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-txt-muted)]"
                  />
                </div>
                
                <div className="h-64 overflow-y-auto space-y-1 pr-1 border border-[var(--color-glass-border)] rounded-xl bg-[var(--color-dark-900)] p-1">
                  {filteredEmployees.map(emp => (
                    <button
                      key={emp.employeeId}
                      onClick={() => setSelectedEmp(emp.employeeId)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                        selectedEmp === emp.employeeId
                          ? 'bg-[var(--color-accent-light)] border border-[var(--color-accent)]/30 text-white'
                          : 'hover:bg-[var(--color-dark-700)] text-[var(--color-txt-secondary)]'
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{emp.name}</span>
                      <span className={`text-[0.65rem] font-mono shrink-0 ${selectedEmp === emp.employeeId ? 'text-violet-300' : 'text-[var(--color-txt-muted)] group-hover:text-[var(--color-txt-secondary)]'}`}>
                        {emp.employeeId}
                      </span>
                    </button>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <div className="text-center py-6 text-sm text-[var(--color-txt-muted)]">No employees found</div>
                  )}
                </div>
              </div>

              {selectedEmp && (
                <div className="glass-card p-4 bg-gradient-to-b from-[var(--color-dark-700)] to-[var(--color-dark-800)]">
                  <p className="text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider mb-3">Attendance Rate</p>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-bold tracking-tight text-white">{attendanceRate}<span className="text-xl text-[var(--color-txt-muted)]">%</span></div>
                    <div className="text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                      All Time
                    </div>
                  </div>
                  <div className="w-full bg-[var(--color-dark-600)] h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full" style={{ width: `${attendanceRate}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider mb-2">
                History: {employees.find(e => e.employeeId === selectedEmp)?.name || '...'}
              </h3>
              
              <div className="glass-card overflow-hidden">
                {loadingHistory ? (
                  <div className="p-8 space-y-4">
                    <div className="h-10 skeleton w-full"></div>
                    <div className="h-10 skeleton w-full"></div>
                    <div className="h-10 skeleton w-full"></div>
                  </div>
                ) : historyRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[var(--color-txt-muted)] border-2 border-dashed border-[var(--color-glass-border)] m-4 rounded-xl">
                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="font-medium text-[var(--color-txt-secondary)]">No records found</p>
                    <p className="text-xs mt-1">This employee has no attendance history yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--color-glass-border)] bg-[var(--color-dark-800)]/80">
                        <th className="px-5 py-3 text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold text-[var(--color-txt-muted)] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-glass-border)]">
                      {historyRecords.map(record => {
                        const d = new Date(record.date);
                        return (
                          <tr key={record._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3.5 text-sm font-medium">
                              {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                            </td>
                            <td className="px-5 py-3.5">
                              {record.status === 'Present' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-emerald-bg)] text-[var(--color-emerald-text)] border border-[var(--color-emerald)]/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-rose-bg)] text-[var(--color-rose-text)] border border-[var(--color-rose)]/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Absent
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl shadow-black/50 border animate-slide-up flex items-center gap-2 z-[2000]
          ${toast.type === 'success' 
            ? 'bg-[var(--color-emerald-bg)] text-[var(--color-emerald-text)] border-[var(--color-emerald)]/30' 
            : 'bg-[var(--color-rose-bg)] text-[var(--color-rose-text)] border-[var(--color-rose)]/30'}`}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
