import React, { forwardRef } from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const CheckboxComponent = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={checkboxId} className="inline-flex items-center gap-3 cursor-pointer">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={`h-5 w-5 rounded-md border border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 transition-colors duration-150 cursor-pointer ${className}`}
            {...props}
          />
          {label ? (
            <span className="text-sm font-medium text-slate-700 select-none">
              {label}
            </span>
          ) : null}
        </label>
        {error ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : null}
      </div>
    );
  }
);

CheckboxComponent.displayName = 'Checkbox';
export const Checkbox = React.memo(CheckboxComponent);
