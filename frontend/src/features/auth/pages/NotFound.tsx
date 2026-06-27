import React from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFoundComponent: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 gap-5">
      <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
        <AlertCircle className="h-9 w-9" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          The page link you followed may be broken, or it was recently moved. Please check your spelling.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Go to Homepage
      </Link>
    </div>
  );
};

export const NotFound = React.memo(NotFoundComponent);
NotFound.displayName = 'NotFound';
export default NotFound;
