import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { AlertCircle, X, ArrowRight } from 'lucide-react';

export const AlertBanner = ({ onNavigateToAlerts }) => {
  const { latestAlert, clearLatestAlert } = useSocket();

  if (!latestAlert) return null;

  const isCritical = latestAlert.severity === 'critical';

  return (
    <div
      className={`relative z-20 px-4 py-3 border-b flex items-center justify-between text-xs sm:text-sm animate-in slide-in-from-top duration-300 ${
        isCritical
          ? 'bg-red-500 text-white border-red-600'
          : 'bg-amber-500 text-slate-950 border-amber-600 font-medium'
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl truncate">
        <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
        <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/20">
          Live Alert
        </span>
        <span className="truncate">{latestAlert.message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {onNavigateToAlerts && (
          <button
            onClick={() => {
              onNavigateToAlerts();
              clearLatestAlert();
            }}
            className={`flex items-center gap-1 font-bold text-xs underline underline-offset-2 ${
              isCritical ? 'hover:text-red-100' : 'hover:text-amber-900'
            }`}
          >
            Review <ArrowRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={clearLatestAlert}
          className="p-1 rounded hover:bg-black/10 transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
