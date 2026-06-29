import { toast } from 'react-hot-toast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const toastService = {
  success(message: string) {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
        } max-w-md w-full bg-white shadow-xl border border-slate-100 rounded-2xl pointer-events-auto flex p-4 gap-3.5 items-start justify-between transition-all duration-300 ease-out`}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-relaxed pr-2">{message}</p>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ));
  },

  error(message: string) {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
        } max-w-md w-full bg-white shadow-xl border border-slate-100 rounded-2xl pointer-events-auto flex p-4 gap-3.5 items-start justify-between transition-all duration-300 ease-out`}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-relaxed pr-2">{message}</p>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ));
  },

  warn(message: string, duration = 4000) {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
        } max-w-md w-full bg-white shadow-xl border border-slate-100 rounded-2xl pointer-events-auto flex p-4 gap-3.5 items-start justify-between transition-all duration-300 ease-out`}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-relaxed pr-2">{message}</p>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ), {
      duration
    });
  },

  info(message: string, duration = 4000) {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
        } max-w-md w-full bg-white shadow-xl border border-slate-100 rounded-2xl pointer-events-auto flex p-4 gap-3.5 items-start justify-between transition-all duration-300 ease-out`}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-relaxed pr-2">{message}</p>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ), {
      duration
    });
  },
};
