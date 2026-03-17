// ─── Sanitise ─────────────────────────────────────────────────────────────────
// Strip HTML tags and common script-injection patterns to prevent XSS.
export const sanitize = (value) => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/<[^>]*>/g, '')           // strip HTML tags
        .replace(/javascript\s*:/gi, '')   // strip javascript: URIs
        .replace(/on\w+\s*=/gi, '')        // strip inline event handlers (onclick=, etc.)
        .trim();
};

// ─── Employee form validation ─────────────────────────────────────────────────
export const DEPARTMENTS = [
    'Engineering', 'Human Resources', 'Marketing',
    'Sales', 'Design', 'Finance', 'Operations'
];

/**
 * Validates the Add Employee form.
 * @param {{ employeeId: string, name: string, email: string, department: string }} data
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export const validateEmployee = (data) => {
    const errors = {};
    const { employeeId, name, email, department } = data;

    if (!employeeId.trim()) {
        errors.employeeId = 'Employee ID is required.';
    } else if (!/^[A-Za-z0-9\-]+$/.test(employeeId.trim())) {
        errors.employeeId = 'Employee ID must only contain letters, numbers, or hyphens.';
    } else if (employeeId.trim().length > 20) {
        errors.employeeId = 'Employee ID must be 20 characters or fewer.';
    }

    if (!name.trim()) {
        errors.name = 'Name is required.';
    } else if (/<[^>]*>/.test(name) || /javascript\s*:/i.test(name)) {
        errors.name = 'Name contains invalid characters.';
    } else if (!/^[A-Za-z\s]+$/.test(name.trim())) {
        errors.name = 'Name must only contain letters and spaces.';
    } else if (name.trim().length < 2 || name.trim().length > 60) {
        errors.name = 'Name must be between 2 and 60 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
        errors.email = 'Email is required.';
    } else if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
    } else if (email.trim().length > 100) {
        errors.email = 'Email must be 100 characters or fewer.';
    }

    if (!department || !DEPARTMENTS.includes(department)) {
        errors.department = 'Please select a valid department.';
    }

    return { valid: Object.keys(errors).length === 0, errors };
};

// ─── Attendance form validation ───────────────────────────────────────────────
/**
 * Validates the Mark Attendance form.
 * @param {{ employeeId: string, date: string, status: string }} data
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export const validateAttendance = ({ employeeId, date, status }) => {
    const errors = {};

    if (!employeeId || !employeeId.trim()) {
        errors.employeeId = 'Please select an employee.';
    }

    if (!date) {
        errors.date = 'Date is required.';
    } else {
        const selected = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (isNaN(selected.getTime())) {
            errors.date = 'Please enter a valid date.';
        } else if (selected > today) {
            errors.date = 'Date cannot be in the future.';
        }
    }

    if (!status || !['Present', 'Absent'].includes(status)) {
        errors.status = 'Status must be Present or Absent.';
    }

    return { valid: Object.keys(errors).length === 0, errors };
};
