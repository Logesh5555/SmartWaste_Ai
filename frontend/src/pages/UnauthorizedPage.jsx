import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = ({ onGoBack }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-slate-900">403 — Unauthorized Access</h2>
      <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md">
        Your authenticated user role does not possess the administrative privileges required to access this resource.
      </p>
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      )}
    </div>
  );
};

export const NotFoundPage = ({ onGoBack }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-black text-slate-300">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The requested municipal view or resource could not be found.
      </p>
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return Home
        </button>
      )}
    </div>
  );
};
