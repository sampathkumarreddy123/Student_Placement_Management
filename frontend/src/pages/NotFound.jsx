import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[#DBEAFE] shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-4 border border-[#DBEAFE]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#172554]">Page Not Found</h1>
        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
          The placement page or resource you are looking for doesn't exist or has been relocated.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button size="sm" icon={ArrowLeft}>
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
