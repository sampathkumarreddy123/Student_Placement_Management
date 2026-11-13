import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading data...', size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 text-slate-500 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
      {text && <span className="text-xs font-medium">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;

