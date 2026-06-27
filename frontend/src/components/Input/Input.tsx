import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const InputComponent = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
          >
            {label}
          </label>
        ) : null}
        
        <div className="relative flex items-center">
          {icon ? (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              {icon}
            </div>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-slate-50 disabled:text-slate-400 ${
              icon ? 'pl-10' : ''
            } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

InputComponent.displayName = 'Input';
export const Input = React.memo(InputComponent);
