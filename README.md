# Student Placement Management Portal

A full-stack campus placement management web application built for colleges and universities. It allows students to manage academic profiles, explore company placement drives, check dynamic eligibility in real-time, apply with a single click, and track multi-round selection outcomes. Placement officers have tools to schedule drives, establish hiring criteria, partner with recruiting companies, review applicant pools, and monitor department-wise placement statistics.

---

## 🚀 Technology Stack

- **Frontend**: React.js 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **API Client**: Axios (with credentials & interceptors)
- **Backend**: Node.js & Express.js (ES Modules)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) stored in HTTP-only cookies
- **Password Security**: bcryptjs hashing with salt rounds

---

## 📁 Project Architecture & Folder Structure

```
Student_Placement_Management/
├── package.json                    # Root script runner for frontend & backend
├── .gitignore                      # Git ignore rules
├── README.md                       # Complete documentation
│
├── backend/                        # Express + Node.js REST API
│   ├── .env                        # Active backend environment variables
│   ├── .env.example                # Sample environment template
│   ├── package.json                # Backend dependencies and scripts
│   ├── server.js                   # Express server entry point, CORS & routes
│   │
│   ├── config/
│   │   └── db.js                   # Mongoose MongoDB connection config
│   │
│   ├── models/                     # Mongoose Schemas & Models
│   │   ├── User.js                 # Authentication & base user schema
│   │   ├── StudentProfile.js       # Roll number, CGPA, backlogs, department, resume
│   │   ├── Company.js              # Corporate recruiter profiles & POCs
│   │   ├── PlacementDrive.js       # Drives, CTC (LPA), criteria & rounds
│   │   └── Application.js          # Student job applications & round status
│   │
│   ├── controllers/                # Request handlers & business logic
│   │   ├── authController.js       # Register, login, logout, getMe
│   │   ├── userController.js       # Student profile & officer stats/directory
│   │   ├── companyController.js    # Partner company CRUD operations
│   │   ├── driveController.js      # Placement drive creation & listing
│   │   └── applicationController.js# Apply, applicant review, status progression
│   │
│   ├── middleware/                 # Route guards & utilities
│   │   ├── authMiddleware.js       # JWT cookie verification & role authorization
│   │   └── errorMiddleware.js      # Global error handling & 404 handler
│   │
│   ├── services/
│   │   └── eligibilityService.js   # Automated eligibility evaluation engine
│   │
│   └── utils/
│       ├── generateToken.js        # JWT issuance & HTTP-only cookie setting
│       └── seedData.js             # Initial database seeder script
│
└── frontend/                       # React 18 + Vite Single Page Application
    ├── index.html                  # HTML entry point with Inter font
    ├── vite.config.js              # Vite config & API reverse proxy
    ├── tailwind.config.js          # Tailwind styling & brand palette
    ├── postcss.config.js           # PostCSS configuration
    ├── package.json                # Frontend dependencies
    ├── .env                        # Frontend environment variables
    ├── .env.example                # Sample environment template
    │
    └── src/
        ├── main.jsx                # React DOM mounting
        ├── App.jsx                 # Top-level Router & Auth Provider
        ├── index.css               # Tailwind directives & custom scrollbars
        │
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx      # Reusable button with variants & loading state
        │   │   ├── Card.jsx        # Standardized white card with subtle borders
        │   │   ├── Input.jsx       # Form input with icon & validation error
        │   │   ├── Badge.jsx       # Status & role indicators
        │   │   ├── Modal.jsx       # Accessible modal dialog with backdrop
        │   │   ├── Alert.jsx       # Banner notifications (success/error/info)
        │   │   ├── LoadingSpinner.jsx # Centered spinner indicator
        │   │   ├── Navbar.jsx      # Sticky top navigation & profile menu
        │   │   └── Sidebar.jsx     # Side navigation with role links
        │   │
        │   └── drives/
        │       ├── DriveCard.jsx   # Drive preview card with package & CTA
        │       └── EligibilityBadge.jsx # Green/Red badge with requirement popover
        │
        ├── context/
        │   └── AuthContext.jsx     # User state, login, register, logout provider
        │
        ├── hooks/
        │   └── useAuth.js          # Custom hook to consume AuthContext
        │
        ├── layouts/
        │   ├── StudentLayout.jsx   # Layout wrapper for student portal
        │   ├── OfficerLayout.jsx   # Layout wrapper for placement officer portal
        │   └── AuthLayout.jsx      # Minimal centered auth layout
        │
        ├── pages/
        │   ├── LandingPage.jsx     # Homepage with feature breakdown & CTA
        │   ├── NotFound.jsx        # 404 page
        │   ├── auth/
        │   │   ├── Login.jsx       # Login form with 1-click demo login buttons
        │   │   └── Register.jsx    # Registration with role selection & student fields
        │   ├── student/
        │   │   ├── StudentDashboard.jsx # Overview, KPIs, recommended drives, applications
        │   │   ├── StudentProfile.jsx   # Editable CGPA, roll no, backlogs, skills
        │   │   ├── DrivesList.jsx       # Search, filter, and apply to drives
        │   │   ├── DriveDetails.jsx     # Full criteria breakdown, rounds & recruiter info
        │   │   └── MyApplications.jsx   # Multi-round applicant status tracker
        │   └── officer/
        │       ├── OfficerDashboard.jsx # Analytics, department rates, active drives
        │       ├── ManageDrives.jsx     # Drive scheduler with eligibility rules
        │       ├── ManageCompanies.jsx  # Recruiter partner database & POCs
        │       ├── ManageStudents.jsx   # Searchable student directory with CGPA & CV
        │       └── ManageApplications.jsx # Status progression & officer feedback notes
        │
        ├── routes/
        │   ├── AppRoutes.jsx       # Route declarations
        │   └── ProtectedRoute.jsx  # Role-based route guard
        │
        ├── services/
        │   ├── api.js              # Axios instance with credentials
        │   ├── authService.js      # Auth API endpoints
        │   ├── driveService.js     # Drives API endpoints
        │   ├── applicationService.js # Application submission & review endpoints
        │   ├── companyService.js   # Recruiter company endpoints
        │   └── studentService.js   # Student records & placement statistics
        │
        └── utils/
            └── formatters.js       # LPA currency, dates & status colors
```

---

## ⚡ Quick Start Guide

### Prerequisites
1. **Node.js**: v18.0.0 or higher
2. **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas connection string.

---

### Step 1: Backend Setup & Seed Data

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```

2. Configure environment variables (a pre-configured `.env` is already created):
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/placement_portal
   JWT_SECRET=super_secret_placement_portal_jwt_token_2026_xyz
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. Seed sample companies, placement drives, students, and officers:
   ```bash
   npm run seed
   ```

4. Start the Express development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`.*

---

### Step 2: Frontend Setup

1. Open a separate terminal window and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client app will launch at `http://localhost:5173`.*

---

## 🔑 Pre-Configured Demo Accounts

For immediate evaluation, the database seeder sets up the following accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Placement Officer** | `officer@college.edu` | `password123` | Placement Head (Full administration permissions) |
| **Student (Eligible)** | `student@college.edu` | `password123` | Rahul Verma (CSE, CGPA 8.75, 0 Backlogs) |
| **Student 2** | `priya@college.edu` | `password123` | Priya Sundaram (ECE, CGPA 7.20, 1 Backlog) |

> **Pro Tip:** On the Login page (`/login`), click the **"Officer Demo"** or **"Student Demo"** quick-fill button to sign in with a single click.

---

## 🛡️ Key Features Implemented

1. **Live Eligibility Engine**: Automatically cross-references a student's CGPA, active backlogs, graduation batch, and department with each placement drive's criteria. Students immediately see a green "Eligible" or red "Not Eligible" tag with bulleted reasons explaining any unmet criteria.
2. **Multi-Stage Selection Workflow**: Placement officers can transition applicants through `Applied` ➔ `Shortlisted` ➔ `Interviewing` ➔ `Selected` / `Rejected`, specify interview rounds, and attach feedback notes.
3. **Automated Placement Status**: Marking an applicant as `Selected` automatically marks their student profile as `Placed` and attributes the recruiting company.
4. **Professional UI System**: Built strictly adhering to college enterprise guidelines with an off-white background (`bg-slate-50`), crisp blue accents (`blue-600`), clean typography, subtle borders, and zero clutter.

