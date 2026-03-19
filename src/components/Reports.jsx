import React, { useState, useEffect } from 'react';
import { fetchEmployees, fetchAttendance } from '../utils/api';

const Reports = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const emps = await fetchEmployees();
      setEmployees(emps);
      const map = {};
      for (const emp of emps) {
        try {
          const records = await fetchAttendance(emp.employeeId);
          map[emp.employeeId] = records;
        } catch {
          map[emp.employeeId] = [];
        }
      }
      setAttendanceMap(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getInitialColor = (name) => {
    const colors = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-rose-500 to-pink-500',
      'from-amber-500 to-orange-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-[var(--color-dark-400)] border-t-violet-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[var(--color-txt-muted)]">Loading reports…</p>
      </div>
    );
  }

  const totalPresent = employees.reduce((sum, emp) => {
    const records = attendanceMap[emp.employeeId] || [];
    return sum + records.filter(r => r.status === 'Present').length;
  }, 0);

  const totalAbsent = employees.reduce((sum, emp) => {
    const records = attendanceMap[emp.employeeId] || [];
    return sum + records.filter(r => r.status === 'Absent').length;
  }, 0);

  const totalRecords = totalPresent + totalAbsent;
  const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  const employeeStats = employees.map(emp => {
    const records = attendanceMap[emp.employeeId] || [];
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { ...emp, present, absent, total, rate };
  }).sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-xs font-medium text-[var(--color-txt-muted)] uppercase tracking-wider mb-1">Total Records</p>
          <p className="text-3xl font-extrabold text-white">{totalRecords}</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-xs font-medium text-[var(--color-txt-muted)] uppercase tracking-wider mb-1">Overall Attendance Rate</p>
          <p className="text-3xl font-extrabold text-emerald-400">{overallRate}%</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-xs font-medium text-[var(--color-txt-muted)] uppercase tracking-wider mb-1">Present / Absent</p>
          <p className="text-3xl font-extrabold">
            <span className="text-emerald-400">{totalPresent}</span>
            <span className="text-[var(--color-txt-muted)] mx-1">/</span>
            <span className="text-rose-400">{totalAbsent}</span>
          </p>
        </div>
      </div>

      {/* Per-employee breakdown */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-glass-border)]">
          <h3 className="text-sm font-bold text-white">Employee Attendance Breakdown</h3>
          <p className="text-xs text-[var(--color-txt-muted)] mt-0.5">Ranked by attendance rate</p>
        </div>
        {employeeStats.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-4xl block mb-3">📊</span>
            <p className="text-sm text-[var(--color-txt-muted)]">No data to report</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-glass-border)]">
            {employeeStats.map((emp) => {
              const barColor = emp.rate >= 75 ? 'bg-emerald-500' : emp.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              const textColor = emp.rate >= 75 ? 'text-emerald-400' : emp.rate >= 50 ? 'text-amber-400' : 'text-rose-400';

              return (
                <div key={emp._id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getInitialColor(emp.name)} flex items-center justify-center text-white text-xs font-bold`}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{emp.name}</p>
                        <p className="text-xs text-[var(--color-txt-muted)]">{emp.department} · {emp.total} records</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <span className="text-xs text-emerald-400 font-medium">{emp.present}P</span>
                        <span className="text-[var(--color-txt-muted)] mx-1">·</span>
                        <span className="text-xs text-rose-400 font-medium">{emp.absent}A</span>
                      </div>
                      <span className={`text-sm font-bold ${textColor} min-w-[3rem] text-right`}>{emp.rate}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-dark-500)] rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`} style={{ width: `${emp.rate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
