import React, { useState } from 'react';
import './index.css';
import EmployeeList from './components/EmployeeList';
import AttendanceMarking from './components/AttendanceMarking';

const App = () => {
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="app-container">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">💼</span>
          HRMS Lite
        </div>

        <p className="nav-section-title">Main Menu</p>
        <nav className="nav-links">
          <div
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Employees
          </div>
          <div
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
              <path d="M8 18h.01" />
              <path d="M12 18h.01" />
            </svg>
            Attendance
          </div>
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">HRMS Lite v1.0<br />© 2026 All rights reserved</p>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="main-content">
        {activeTab === 'employees' ? <EmployeeList /> : <AttendanceMarking />}
      </main>
    </div>
  );
};

export default App;
