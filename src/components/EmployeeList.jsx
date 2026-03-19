import React, { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/api';
import { sanitize, validateEmployee, DEPARTMENTS } from '../utils/validate';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
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
      setError(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitized = {
      employeeId: sanitize(formData.employeeId),
      name: sanitize(formData.name),
      email: sanitize(formData.email),
      department: formData.department
    };
    const { valid, errors } = validateEmployee(sanitized);
    if (!valid) { setFieldErrors(errors); return; }

    setFieldErrors({});
    setSubmitting(true);
    try {
      if (editMode) {
        await updateEmployee(editId, sanitized);
        showToast('Employee updated successfully!');
      } else {
        await createEmployee(sanitized);
        showToast('Employee added successfully!');
      }
      setShowModal(false);
      setFormData({ employeeId: '', name: '', email: '', department: 'Engineering' });
      loadEmployees();
    } catch (err) {
      const msg = err.message || 'Failed to save employee.';
      if (msg.toLowerCase().includes('id')) setFieldErrors({ employeeId: msg });
      else if (msg.toLowerCase().includes('email')) setFieldErrors({ email: msg });
      else setFieldErrors({ _form: msg });
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
      showToast(err.message || 'Failed to remove employee.', 'error');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setEditId(null);
    setFieldErrors({});
    setFormData({ employeeId: '', name: '', email: '', department: 'Engineering' });
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditMode(true);
    setEditId(emp._id);
    setFieldErrors({});
    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      department: emp.department
    });
    setShowModal(true);
  };

  const inputCls = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-dark-600)] border border-[var(--color-glass-border)] text-sm text-white placeholder:text-[var(--color-txt-muted)] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 ${fieldErrors[field] ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`;

  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });

  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-[var(--color-dark-400)] border-t-violet-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[var(--color-txt-muted)]">Loading employees…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Employees</h2>
          <p className="text-sm text-[var(--color-txt-muted)] mt-0.5">Manage your organisation's workforce</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all active:scale-[0.97]"
          onClick={openAddModal}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Stats & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 flex items-center gap-3 px-4 bg-[var(--color-dark-800)] border border-[var(--color-glass-border)] rounded-xl group transition-all focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
          <svg className="w-5 h-5 text-[var(--color-txt-muted)] group-focus-within:text-violet-400 transition-colors shrink-0" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 py-3 bg-transparent text-sm text-white placeholder:text-[var(--color-txt-muted)] outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 shrink-0 min-w-[300px]">
          <div className="glass-card p-4 flex flex-col justify-center">
            <p className="text-[0.65rem] font-medium text-[var(--color-txt-muted)] uppercase tracking-wider">Total</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{employees.length}</p>
          </div>
          <div className="glass-card p-4 flex flex-col justify-center">
            <p className="text-[0.65rem] font-medium text-[var(--color-txt-muted)] uppercase tracking-wider">Depts</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{new Set(employees.map(e => e.department)).size}</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={loadEmployees} className="ml-auto underline text-rose-400 hover:text-rose-300 text-sm">Retry</button>
        </div>
      )}

      {/* Table card */}
      <div className="glass-card overflow-hidden">
        {employees.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-5xl block mb-3">👥</span>
            <p className="text-sm font-semibold text-white mb-1">No employees yet</p>
            <p className="text-xs text-[var(--color-txt-muted)]">Get started by adding your first employee.</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-sm font-semibold text-white mb-1">No matches found</p>
            <p className="text-xs text-[var(--color-txt-muted)]">No employees match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-glass-border)] bg-[var(--color-dark-800)]">
                  <th className="px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-txt-muted)]">Employee</th>
                  <th className="px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-txt-muted)]">Contact</th>
                  <th className="px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-txt-muted)]">Department</th>
                  <th className="px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--color-txt-muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="border-b border-[var(--color-glass-border)] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{emp.name}</p>
                          <p className="text-xs font-mono text-violet-400 mt-0.5">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--color-txt-secondary)]">{emp.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[0.7rem] font-medium text-[var(--color-txt-muted)] bg-[var(--color-dark-500)] px-2.5 py-1 rounded-full">{emp.department}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-400 border border-[var(--color-glass-border)] hover:bg-blue-500/10 hover:border-blue-500/30 transition-all active:scale-95"
                          title="Edit Employee"
                          onClick={() => openEditModal(emp)}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-400 border border-[var(--color-glass-border)] hover:bg-rose-500/10 hover:border-rose-500/30 transition-all active:scale-95"
                          title="Remove Employee"
                          onClick={() => handleDelete(emp._id, emp.name)}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-[var(--color-dark-700)] border border-[var(--color-glass-border)] p-6 sm:p-8 rounded-2xl w-full max-w-[480px] shadow-2xl shadow-black/50 animate-slide-up">
            <h2 className="text-lg font-bold text-white mb-1">{editMode ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-xs text-[var(--color-txt-muted)] mb-6">
              {editMode ? 'Update the details for this employee.' : 'Fill in the details below to register a new employee.'}
            </p>

            {fieldErrors._form && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-2.5 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
                <span>⚠️</span> {fieldErrors._form}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-[var(--color-txt-primary)]">
                  Employee ID <span className="font-normal text-[var(--color-txt-muted)] text-xs">(letters, numbers, hyphens — max 20)</span>
                </label>
                <input type="text" placeholder="e.g. EMP-001" value={formData.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} className={inputCls('employeeId')} maxLength={20} autoComplete="off" />
                {fieldErrors.employeeId && <p className="mt-1 text-xs text-rose-400">{fieldErrors.employeeId}</p>}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-[var(--color-txt-primary)]">Full Name</label>
                <input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputCls('name')} maxLength={60} autoComplete="off" />
                {fieldErrors.name && <p className="mt-1 text-xs text-rose-400">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-[var(--color-txt-primary)]">Email Address</label>
                <input type="email" placeholder="e.g. john@company.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={inputCls('email')} maxLength={100} autoComplete="off" />
                {fieldErrors.email && <p className="mt-1 text-xs text-rose-400">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-[var(--color-txt-primary)]">Department</label>
                <select value={formData.department} onChange={(e) => handleChange('department', e.target.value)} className={inputCls('department')}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {fieldErrors.department && <p className="mt-1 text-xs text-rose-400">{fieldErrors.department}</p>}
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-txt-secondary)] border border-[var(--color-glass-border)] hover:bg-white/5 transition-all" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
                  {submitting ? 'Saving…' : (editMode ? 'Save Changes' : 'Save Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white z-[2000] shadow-xl animate-slide-up ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
