import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Checking authentication status..." />
      </div>
    );
  }

  if (!user) {
    const isOfficerRoute = location.pathname.startsWith('/officer');
    const redirectLogin = isOfficerRoute ? '/officer/login' : '/student/login';
    return <Navigate to={redirectLogin} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard
    const redirectPath = user.role === 'officer' ? '/officer/dashboard' : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;

