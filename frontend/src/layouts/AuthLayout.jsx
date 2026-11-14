import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className={`w-full ${isRegister ? 'max-w-lg' : 'max-w-md'} mx-auto`}>
        <div className="bg-white p-6 sm:p-8 shadow-sm border border-[#E8DED2] rounded-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
