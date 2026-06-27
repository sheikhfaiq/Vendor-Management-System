import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const CardComponent: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden ${className}`}>
      {title || subtitle || headerAction ? (
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between gap-4">
          <div>
            {title ? (
              <h3 className="text-base font-semibold text-slate-800 tracking-tight">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {headerAction ? <div>{headerAction}</div> : null}
        </div>
      ) : null}

      <div className="px-6 py-5">{children}</div>

      {footer ? (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-50 flex items-center justify-end">
          {footer}
        </div>
      ) : null}
    </div>
  );
};

export const Card = React.memo(CardComponent);
Card.displayName = 'Card';
