import React from 'react';

export const LoadingSkeleton = ({ count = 4, type = 'card' }) => {
  if (type === 'table') {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-1/12 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
          </div>
          <div className="h-7 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
