import { toast } from 'react-hot-toast';

export const toastService = {
  success(message: string) {
    toast.success(message, {
      style: {
        borderRadius: '12px',
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
      },
      iconTheme: {
        primary: '#15803D',
        secondary: '#ffffff',
      },
    });
  },

  error(message: string) {
    toast.error(message, {
      style: {
        borderRadius: '12px',
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  },

  warn(message: string) {
    toast(message, {
      icon: '⚠️',
      style: {
        borderRadius: '12px',
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
      },
    });
  },

  info(message: string) {
    toast(message, {
      icon: 'ℹ️',
      style: {
        borderRadius: '12px',
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
      },
    });
  },
};
