import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const LoaderComponent: React.FC<LoaderProps> = ({ size = 'md', fullPage = false }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-slate-200 border-t-primary ${sizeClasses[size]}`}
      role="status"
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50/70 backdrop-blur-xxs flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-6 w-full">
      {spinner}
    </div>
  );
};

export const Loader = React.memo(LoaderComponent);
Loader.displayName = 'Loader';
