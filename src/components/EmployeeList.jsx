import React, { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, deleteEmployee } from '../utils/api';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'Engineering'
  });

  const departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Design', 'Finance', 'Operations'];

  useEffect(() => {
    loadEmployees();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createEmployee(formData);
      setShowModal(false);
      setFormData({ employeeId: '', name: '', email: '', department: 'Engineering' });
      showToast('Employee added successfully!');
      loadEmployees();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await deleteEmployee(id);
      showToast('Employee removed.');
      loadEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openModal = () => {
    setFormError(null);
    setFormData({ employeeId: '', name: '', email: '', department: 'Engineering' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading employees…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your organisation's workforce</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Employee
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Total Employees</p>
          <p className="stat-value">{employees.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Departments</p>
          <p className="stat-value">{new Set(employees.map(e => e.department)).size}</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="card">
        {employees.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p className="empty-title">No employees yet</p>
            <p className="empty-text">Get started by adding your first employee.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td><span className="emp-id">{emp.employeeId}</span></td>
                    <td><span className="emp-name">{emp.name}</span></td>
                    <td>{emp.email}</td>
                    <td><span className="dept-badge">{emp.department}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp._id, emp.name)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Add New Employee</h2>
            <p className="modal-subtitle">Fill in the details below to register a new employee.</p>

            {formError && (
              <div className="error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Employee ID <span className="form-hint">(must be unique)</span></label>
                <input
                  type="text"
                  placeholder="e.g. EMP-001"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
