const API_URL = 'https://hrms-backend-nu-drab.vercel.app/api';

export const fetchEmployees = async () => {
  const res = await fetch(`${API_URL}/employees`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
};

export const createEmployee = async (data) => {
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create employee');
  }
  return res.json();
};

export const deleteEmployee = async (id) => {
  const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete employee');
  return res.json();
};

export const fetchAttendance = async (employeeId) => {
  const res = await fetch(`${API_URL}/attendance/${employeeId}`);
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
};

export const markAttendance = async (data) => {
  const res = await fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to mark attendance');
  }
  return res.json();
};
