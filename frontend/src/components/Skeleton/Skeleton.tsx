import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

const SkeletonComponent: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClass = 'animate-pulse bg-slate-100';
  
  const variants = {
    text: 'h-4 rounded-md w-full',
    rect: 'h-24 rounded-xl w-full',
    circle: 'h-10 w-10 rounded-full shrink-0',
  };

  return <div className={`${baseClass} ${variants[variant]} ${className}`} />;
};

export const Skeleton = React.memo(SkeletonComponent);
Skeleton.displayName = 'Skeleton';
export default Skeleton;
