import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            CampusPlacement
          </span>
        </Link>
        <p className="mt-2 text-xs text-slate-500">
          Professional Placement Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

