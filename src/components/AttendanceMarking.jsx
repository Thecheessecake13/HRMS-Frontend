import React, { useState, useEffect } from 'react';
import { fetchEmployees, markAttendance, fetchAttendance } from '../utils/api';

const AttendanceMarking = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Present');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmp) loadAttendance(selectedEmp);
  }, [selectedEmp]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      if (data.length > 0) setSelectedEmp(data[0].employeeId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (empId) => {
    try {
      const data = await fetchAttendance(empId);
      setAttendance(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await markAttendance({ employeeId: selectedEmp, date, status });
      loadAttendance(selectedEmp);
      showToast('Attendance marked!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const presentCount = attendance.filter(r => r.status === 'Present').length;
  const absentCount = attendance.filter(r => r.status === 'Absent').length;
  const selectedEmployee = employees.find(e => e.employeeId === selectedEmp);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading attendance data…</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance</h1>
            <p className="page-subtitle">Track daily employee attendance</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p className="empty-title">No employees found</p>
            <p className="empty-text">Add employees first before marking attendance.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            Track daily attendance for your team
            {selectedEmployee && <> — viewing <strong>{selectedEmployee.name}</strong></>}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3>Mark Attendance</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="attendance-form">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Employee</label>
              <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Present">✓ Present</option>
                <option value="Absent">✕ Absent</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 'fit-content', alignSelf: 'end' }}>
              Submit
            </button>
          </form>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Total Records</p>
          <p className="stat-value">{attendance.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Present Days</p>
          <p className="stat-value" style={{ color: 'var(--success)' }}>{presentCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Absent Days</p>
          <p className="stat-value" style={{ color: 'var(--danger)' }}>{absentCount}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Attendance History</h3>
        </div>
        {attendance.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <p className="empty-title">No records yet</p>
            <p className="empty-text">Mark attendance above to see records here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => {
                  const d = new Date(record.date);
                  return (
                    <tr key={record._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td>{d.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                      <td>
                        <span className={`badge badge-${record.status.toLowerCase()}`}>
                          <span className="badge-dot"></span>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
