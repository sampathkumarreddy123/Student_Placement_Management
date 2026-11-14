import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[#E8DED2] shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#F1E7D9] text-[#76543D] flex items-center justify-center mx-auto mb-4 border border-[#E8DED2]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#44352D]">Page Not Found</h1>
        <p className="text-xs text-[#82776C] mt-2 leading-relaxed">
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

