import React, { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, deleteEmployee } from '../utils/api';
import { sanitize, validateEmployee, DEPARTMENTS } from '../utils/validate';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'Engineering'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err.message || 'Failed to load employees. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update a single form field and clear its field error on change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1 — Client-side validation
    const sanitized = {
      employeeId: sanitize(formData.employeeId),
      name: sanitize(formData.name),
      email: sanitize(formData.email),
      department: formData.department
    };
    const { valid, errors } = validateEmployee(sanitized);
    if (!valid) {
      setFieldErrors(errors);
      return;
    }

    // 2 — API call
    setFieldErrors({});
    setSubmitting(true);
    try {
      await createEmployee(sanitized);
      setShowModal(false);
      setFormData({ employeeId: '', name: '', email: '', department: 'Engineering' });
      showToast('Employee added successfully!');
      loadEmployees();
    } catch (err) {
      // Server returned a field-specific message — show inline if possible
      const msg = err.message || 'Failed to add employee. Please try again.';
      if (msg.toLowerCase().includes('id')) {
        setFieldErrors({ employeeId: msg });
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: msg });
      } else {
        setFieldErrors({ _form: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await deleteEmployee(id);
      showToast('Employee removed.');
      loadEmployees();
    } catch (err) {
      showToast(err.message || 'Failed to remove employee. Please try again.', 'error');
    }
  };

  const openModal = () => {
    setFieldErrors({});
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
          <button
            onClick={loadEmployees}
            style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'inherit' }}
          >
            Retry
          </button>
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

            {fieldErrors._form && (
              <div className="error-banner" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span> {fieldErrors._form}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">
                  Employee ID <span className="form-hint">(letters, numbers, hyphens — max 20 chars)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. EMP-001"
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  className={fieldErrors.employeeId ? 'input-error' : ''}
                  maxLength={20}
                  autoComplete="off"
                />
                {fieldErrors.employeeId && <p className="field-error">{fieldErrors.employeeId}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={fieldErrors.name ? 'input-error' : ''}
                  maxLength={60}
                  autoComplete="off"
                />
                {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={fieldErrors.email ? 'input-error' : ''}
                  maxLength={100}
                  autoComplete="off"
                />
                {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className={fieldErrors.department ? 'input-error' : ''}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {fieldErrors.department && <p className="field-error">{fieldErrors.department}</p>}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Employee'}
                </button>
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
