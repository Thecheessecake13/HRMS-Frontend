# HRMS Lite - Frontend

This is the React-based frontend application for the HRMS Lite system.

## 🚀 Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: Custom SVG-based icon system
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **API Communication**: Native `fetch` API via `src/utils/api.js`

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

The frontend is configured to communicate with the backend via the `API_URL` defined in `src/utils/api.js`. Adjust this value based on your environment:

```javascript
const API_URL = 'http://localhost:5001/api'; // Local development
// const API_URL = 'https://your-backend-api.vercel.app/api'; // Production
```

### Running the Application

- **Development server**:
    ```bash
    npm run dev
    ```
- **Build for production**:
    ```bash
    npm run build
    ```
- **Preview production build**:
    ```bash
    npm run preview
    ```

## 📋 Features

- **Dashboard**: High-level overview of metrics and recent activity.
- **Employee Management**: List, add, edit, and delete employee records.
- **Attendance Tracking**: Simple interface to mark daily attendance.
- **Reports**: Data visualization and report viewing.
- **Activity Log**: Audit trail of system actions with real-time notifications.
- **Global Search**: Quick navigation using the `/` keyboard shortcut.

## 📁 Directory Structure

- `src/App.jsx`: Main layout and routing logic.
- `src/components/`: Reusable UI components.
- `src/utils/`: API communication and validation utilities.
- `src/index.css`: Global styles and Tailwind configuration.
