import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none duration-150';

  const variants = {
    primary:
      'bg-primary border-primary hover:bg-primary-hover text-white focus:ring-primary',
    secondary:
      'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-500',
    danger:
      'bg-red-600 border-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline:
      'bg-transparent border-primary hover:bg-primary-light text-primary focus:ring-primary',
  };

  const currentClass = `${baseStyle} ${variants[variant]} ${className}`;

  return (
    <button disabled={disabled || isLoading} className={currentClass} {...props}>
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export const Button = React.memo(ButtonComponent);
Button.displayName = 'Button';
