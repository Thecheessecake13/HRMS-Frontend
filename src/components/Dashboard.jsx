import React, { useState, useEffect, useRef } from 'react';
import { fetchEmployees, fetchAttendance } from '../utils/api';

// Animated counting number
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 600;
    const step = Math.ceil(end / (duration / 20));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
};

// Donut chart (pure SVG)
const DonutChart = ({ data }) => {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 44;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = total > 0 ? (d.value / total) : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...d, dash, gap, offset, key: i };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      {segments.map(seg => (
        <circle
          key={seg.key}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={-seg.offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      ))}
    </svg>
  );
};

const getInitialColor = (name) => {
  const colors = ['from-violet-500 to-purple-600','from-blue-500 to-cyan-500','from-emerald-500 to-teal-500','from-rose-500 to-pink-500','from-amber-500 to-orange-500','from-indigo-500 to-blue-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const DEPT_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#f43f5e','#06b6d4','#84cc16'];

const Dashboard = ({ onNavigate }) => {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [todayRecords, setTodayRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const emps = await fetchEmployees();
      setEmployees(emps);
      const map = {};
      const todayList = [];
      const feed = [];
      for (const emp of emps) {
        try {
          const records = await fetchAttendance(emp.employeeId);
          map[emp.employeeId] = records;
          records.forEach(r => {
            if (r.date && r.date.startsWith(todayStr)) todayList.push({ ...r, empName: emp.name, empDept: emp.department });
          });
          if (records.length > 0) {
            const last = records[records.length - 1];
            feed.push({ text: `${emp.name} marked ${last.status}`, date: last.date, status: last.status, emp });
          }
        } catch { map[emp.employeeId] = []; }
      }
      // recent employees as feed entries
      emps.slice(-3).reverse().forEach(emp => {
        feed.push({ text: `${emp.name} joined as new employee`, type: 'join', emp });
      });
      setAttendanceMap(map);
      setTodayRecords(todayList);
      setActivityFeed(feed.slice(0, 8));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const departments = new Set(employees.map(e => e.department));
  const presentToday = todayRecords.filter(r => r.status === 'Present').length;
  const absentToday = todayRecords.filter(r => r.status === 'Absent').length;
  const recentEmployees = [...employees].slice(-5).reverse();

  // Dept breakdown for donut
  const deptCountMap = {};
  employees.forEach(e => { deptCountMap[e.department] = (deptCountMap[e.department] || 0) + 1; });
  const deptData = Object.entries(deptCountMap).map(([name, value], i) => ({ name, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: 'text-violet-400', ring: 'bg-violet-500/15', glow: 'shadow-violet-500/10', grad: 'from-violet-500/15 to-transparent', border: 'hover:border-violet-500/20' },
    { label: 'Departments', value: departments.size, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>, color: 'text-blue-400', ring: 'bg-blue-500/15', glow: 'shadow-blue-500/10', grad: 'from-blue-500/15 to-transparent', border: 'hover:border-blue-500/20' },
    { label: 'Present Today', value: presentToday, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>, color: 'text-emerald-400', ring: 'bg-emerald-500/15', glow: 'shadow-emerald-500/10', grad: 'from-emerald-500/15 to-transparent', border: 'hover:border-emerald-500/20' },
    { label: 'Absent Today', value: absentToday, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>, color: 'text-rose-400', ring: 'bg-rose-500/15', glow: 'shadow-rose-500/10', grad: 'from-rose-500/15 to-transparent', border: 'hover:border-rose-500/20' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-5 h-24 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card h-64 skeleton" />
          <div className="glass-card h-64 skeleton" />
        </div>
        <div className="glass-card h-48 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`glass-card glass-card-hover p-5 bg-gradient-to-br ${s.grad} ${s.border} transition-all`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-txt-muted)] uppercase tracking-wider mb-2">{s.label}</p>
                <p className={`text-3xl font-extrabold ${s.color} leading-none animate-count-up`}>
                  <AnimatedNumber value={s.value} />
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.ring} flex items-center justify-center ${s.color} shadow-lg ${s.glow}`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second row: Recently Added + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-glass-border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Recently Added</h3>
              <p className="text-xs text-[var(--color-txt-muted)] mt-0.5">Last {recentEmployees.length} employees</p>
            </div>
            <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10" onClick={() => onNavigate?.('employees')}>
              View all →
            </button>
          </div>
          <div className="divide-y divide-[var(--color-glass-border)]">
            {recentEmployees.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-3xl block mb-2">👤</span>
                <p className="text-sm text-[var(--color-txt-muted)]">No employees added yet</p>
                <button className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline" onClick={() => onNavigate?.('employees')}>Add your first employee</button>
              </div>
            ) : recentEmployees.map((emp) => (
              <div key={emp._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getInitialColor(emp.name)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{emp.name}</p>
                    <p className="text-xs text-[var(--color-txt-muted)]">{emp.department}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md">{emp.employeeId}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Attendance + mini donut */}
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--color-glass-border)]">
            <h3 className="text-sm font-bold text-white">Today's Attendance</h3>
            <p className="text-xs text-[var(--color-txt-muted)] mt-0.5">{todayDisplay}</p>
          </div>

          {todayRecords.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 px-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-dark-600)] flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-[var(--color-txt-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="17" y1="11" x2="23" y2="11"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--color-txt-secondary)]">No attendance today</p>
              <p className="text-xs text-[var(--color-txt-muted)] mt-1">No records marked yet</p>
              <button className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline" onClick={() => onNavigate?.('attendance')}>Mark attendance →</button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-glass-border)] flex-1 overflow-y-auto max-h-56">
              {todayRecords.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getInitialColor(r.empName)} flex items-center justify-center text-white text-[0.65rem] font-bold`}>
                      {r.empName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{r.empName}</p>
                      <p className="text-[0.68rem] text-[var(--color-txt-muted)]">{r.empDept}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${r.status === 'Present' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                    <span className={`w-1 h-1 rounded-full ${r.status === 'Present' ? 'bg-emerald-400' : 'bg-rose-400'}`}/>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Third row: Dept Donut + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">By Department</h3>
          {employees.length === 0 ? (
            <p className="text-xs text-[var(--color-txt-muted)] text-center py-8">No data</p>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
              <div className="relative shrink-0">
                <DonutChart data={deptData} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white">{employees.length}</span>
                  <span className="text-[0.65rem] text-[var(--color-txt-muted)]">total</span>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {deptData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-[var(--color-txt-secondary)] truncate max-w-[110px]">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white ml-2">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-glass-border)]">
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            <p className="text-xs text-[var(--color-txt-muted)] mt-0.5">Latest team actions</p>
          </div>
          {activityFeed.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[var(--color-txt-muted)]">No activity yet</p>
            </div>
          ) : (
            <div className="relative px-5 py-4 space-y-4">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  {i < activityFeed.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--color-glass-border)]" />
                  )}
                  <div className={`w-8 h-8 rounded-full shrink-0 bg-gradient-to-br ${getInitialColor(item.emp?.name || 'a')} flex items-center justify-center text-white text-[0.65rem] font-bold shadow z-10`}>
                    {item.emp?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium leading-relaxed">{item.text}</p>
                    {item.date && (
                      <p className="text-[0.68rem] text-[var(--color-txt-muted)] mt-0.5">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    {item.type === 'join' && (
                      <span className="inline-block text-[0.65rem] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded mt-1">New hire</span>
                    )}
                  </div>
                  {item.status && (
                    <span className={`text-[0.65rem] font-semibold shrink-0 px-2 py-0.5 rounded-full ${item.status === 'Present' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                      {item.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overall Attendance Summary table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-glass-border)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Overall Attendance Summary</h3>
            <p className="text-xs text-[var(--color-txt-muted)] mt-0.5">All-time record per employee</p>
          </div>
          <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10" onClick={() => onNavigate?.('reports')}>
            Full report →
          </button>
        </div>
        {employees.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[var(--color-txt-muted)]">No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-glass-border)]">
                  {['Emp ID','Name','Department','Present','Absent','Rate'].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-txt-muted)] bg-[var(--color-dark-800)] ${i >= 3 ? 'text-center' : ''} ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const records = attendanceMap[emp.employeeId] || [];
                  const present = records.filter(r => r.status === 'Present').length;
                  const absent = records.filter(r => r.status === 'Absent').length;
                  const total = present + absent;
                  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                  const barColor = rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                  const textColor = rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-rose-400';
                  return (
                    <tr key={emp._id} className="border-b border-[var(--color-glass-border)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{emp.employeeId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getInitialColor(emp.name)} flex items-center justify-center text-white text-[0.6rem] font-bold`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-[var(--color-txt-muted)] bg-[var(--color-dark-500)] px-2 py-0.5 rounded-full">{emp.department}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-sm font-semibold text-emerald-400">{present}</td>
                      <td className="px-5 py-3.5 text-center text-sm font-semibold text-rose-400">{absent}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="w-20 h-1.5 bg-[var(--color-dark-500)] rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${rate}%` }}/>
                          </div>
                          <span className={`text-xs font-bold ${textColor} w-10 text-right`}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions row */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-glass-border)] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group text-left"
            onClick={() => onNavigate?.('employees')}
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/25 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Add Employee</p>
              <p className="text-xs text-[var(--color-txt-muted)]">Register a new team member</p>
            </div>
          </button>
          <button
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-glass-border)] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group text-left"
            onClick={() => onNavigate?.('attendance')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Mark Attendance</p>
              <p className="text-xs text-[var(--color-txt-muted)]">Log today's presence</p>
            </div>
          </button>
          <button
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-glass-border)] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group text-left"
            onClick={() => onNavigate?.('reports')}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/25 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">View Reports</p>
              <p className="text-xs text-[var(--color-txt-muted)]">Analyse attendance trends</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
