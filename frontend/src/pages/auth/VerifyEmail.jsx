import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, GraduationCap } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DBEAFE]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#172554] text-sm tracking-tight">
            MITS Placements
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-[#64748B] hover:text-[#172554] transition-colors"
        >
          Back to Home
        </Link>
      </div>

      <div className="py-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#0D9488] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#172554] tracking-tight">
            Account Active & Verified
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed max-w-sm mx-auto">
            Email verification is no longer required. All student accounts are automatically verified and active immediately upon registration.
          </p>
        </div>

        <div className="pt-3">
          {user ? (
            <Button
              variant="primary"
              onClick={() => navigate('/student/drives')}
              className="w-full text-xs"
              icon={ArrowRight}
            >
              Browse Placement Drives
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => navigate('/student/login')}
              className="w-full text-xs"
              icon={ArrowRight}
            >
              Sign In to Student Account
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
