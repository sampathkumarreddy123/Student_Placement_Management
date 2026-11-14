import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import StudentLayout from '../layouts/StudentLayout';
import OfficerLayout from '../layouts/OfficerLayout';
import AuthLayout from '../layouts/AuthLayout';

// Guard
import ProtectedRoute from './ProtectedRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import Login from '../pages/auth/Login';
import StudentLogin from '../pages/auth/StudentLogin';
import OfficerLogin from '../pages/auth/OfficerLogin';
import OfficerRegister from '../pages/auth/OfficerRegister';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import NotFound from '../pages/NotFound';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import DrivesList from '../pages/student/DrivesList';
import DriveDetails from '../pages/student/DriveDetails';
import MyApplications from '../pages/student/MyApplications';

// Officer Pages
import OfficerDashboard from '../pages/officer/OfficerDashboard';
import ManageDrives from '../pages/officer/ManageDrives';
import ManageCompanies from '../pages/officer/ManageCompanies';
import ManageStudents from '../pages/officer/ManageStudents';
import ManageApplications from '../pages/officer/ManageApplications';
import NotificationsPage from '../pages/NotificationsPage';

// Hook
import { useAuth } from '../hooks/useAuth';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<Register />} />
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/register" element={<OfficerRegister />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="drives" element={<DrivesList />} />
        <Route path="applications" element={<MyApplications />} />
      </Route>

      {/* Officer Routes */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/officer/dashboard" replace />} />
        <Route path="dashboard" element={<OfficerDashboard />} />
        <Route path="drives" element={<ManageDrives />} />
        <Route path="companies" element={<ManageCompanies />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="applications" element={<ManageApplications />} />
      </Route>

      {/* Drive Details Route - works for both Student and Officer */}
      <Route
        path="/drives/:id"
        element={
          <ProtectedRoute>
            {user?.role === 'officer' ? (
              <OfficerLayout />
            ) : (
              <StudentLayout />
            )}
          </ProtectedRoute>
        }
      >
        <Route index element={<DriveDetails />} />
      </Route>

      {/* Notifications Route - works for both Student and Officer */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            {user?.role === 'officer' ? (
              <OfficerLayout />
            ) : (
              <StudentLayout />
            )}
          </ProtectedRoute>
        }
      >
        <Route index element={<NotificationsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

