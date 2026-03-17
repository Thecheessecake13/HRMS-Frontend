# HRMS Lite – Human Resource Management System

A lightweight full-stack HR management application that lets you manage employees and track daily attendance through a clean, modern UI.

---

## Project Overview

HRMS Lite is a full-stack web application built as an assignment project. It provides two core modules:

- **Employee Management** – Add, view, and delete employees (with fields: Employee ID, Name, Email, Department).
- **Attendance Tracking** – Mark and retrieve daily attendance (Present / Absent) per employee.

The frontend communicates with a RESTful backend API backed by a MongoDB database.

---

##  Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI library |
| Vite | Development server & bundler |
| Vanilla CSS | Styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express 5 | REST API framework |
| Mongoose 9 | MongoDB ODM |
| dotenv | Environment variable management |
| cors | Cross-Origin Resource Sharing |
| nodemon | Dev auto-reload |

### Database
| Technology | Purpose |
|---|---|
| MongoDB | NoSQL database (via MongoDB Atlas or local) |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Backend hosting (`vercel.json` configured) |

---

##  Steps to Run the Project Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- [MongoDB](https://www.mongodb.com/) running locally **or** a MongoDB Atlas connection string
- `npm` (comes with Node.js)

---

### 1. Clone / Open the Repository

```bash
cd /path/to/assignment
```

---

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```env
MONGODB_URI=mongodb://localhost:27017/hrms
PORT=5001
```

> Replace `MONGODB_URI` with your MongoDB Atlas URI if you are not running MongoDB locally.

Start the backend server:

```bash
# Development (auto-reload with nodemon)
npm run dev

# OR Production
npm start
```

The backend will be available at: **http://localhost:5001**

---

### 3. Set Up the Frontend

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

### 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List all employees |
| `POST` | `/api/employees` | Add a new employee |
| `DELETE` | `/api/employees/:id` | Delete an employee by MongoDB `_id` |
| `POST` | `/api/attendance` | Mark attendance (upserts on same date) |
| `GET` | `/api/attendance/:employeeId` | Get attendance history for an employee |

---

## Assumptions & Limitations

- **No authentication** – The application does not implement any login or role-based access control. All routes are publicly accessible.
- **Employee ID uniqueness** – `employeeId` is a manually entered string field and must be unique; there is no auto-generation.
- **Attendance is binary** – Status can only be `Present` or `Absent`; no support for partial attendance (e.g., half-day, late).
- **One attendance record per day** – Submitting attendance for the same employee on the same date will **overwrite** the previous entry (upsert behaviour).
- **No pagination** – The employee list and attendance records are fetched in full without pagination; performance may degrade with large datasets.
- **Frontend API base URL** – The frontend must point to the correct backend URL. Update the base URL in `src/utils/` if deploying to a different environment.
- **MongoDB required** – The backend requires a running MongoDB instance (local or Atlas). There is no in-memory or SQLite fallback.
