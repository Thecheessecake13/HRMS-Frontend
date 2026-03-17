const API_URL = 'https://hrms-backend-nu-drab.vercel.app/api';

// ─── Shared response handler ──────────────────────────────────────────────────
// Always extracts the `message` field from the JSON body on errors.
const handleResponse = async (res) => {
  if (res.ok) return res.json();
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    message = body.message || message;
  } catch {
    // response body wasn't JSON — keep the default message
  }
  const err = new Error(message);
  err.status = res.status;
  throw err;
};

// ─── Employees ────────────────────────────────────────────────────────────────
export const fetchEmployees = async () => {
  const res = await fetch(`${API_URL}/employees`);
  return handleResponse(res);
};

export const createEmployee = async (data) => {
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};

export const deleteEmployee = async (id) => {
  const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
  return handleResponse(res);
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const fetchAttendance = async (employeeId) => {
  const res = await fetch(`${API_URL}/attendance/${employeeId}`);
  return handleResponse(res);
};

export const markAttendance = async (data) => {
  const res = await fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};
