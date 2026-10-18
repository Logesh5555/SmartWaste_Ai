import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'emerald', trend, changeLabel }) => {
  const colorMap = {
    emerald: {
      hoverGlow: 'hover:border-emerald-300 card-hover-glow-emerald',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white',
      accentBar: 'bg-emerald-500',
    },
    amber: {
      hoverGlow: 'hover:border-amber-300 card-hover-glow-amber',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white',
      accentBar: 'bg-amber-500',
    },
    red: {
      hoverGlow: 'hover:border-red-300 card-hover-glow-red',
      iconBg: 'bg-red-50 text-red-600 border border-red-100 group-hover:bg-red-500 group-hover:text-white',
      accentBar: 'bg-red-500',
    },
    blue: {
      hoverGlow: 'hover:border-blue-300 card-hover-glow-blue',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-500 group-hover:text-white',
      accentBar: 'bg-blue-500',
    },
    purple: {
      hoverGlow: 'hover:border-purple-300',
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-500 group-hover:text-white',
      accentBar: 'bg-purple-500',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={`group relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all duration-300 cursor-default overflow-hidden ${scheme.hoverGlow}`}
    >
      {/* Top ambient hover accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${scheme.accentBar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-800 transition-colors">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 shadow-sm ${scheme.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:scale-[1.02] transform transition-transform origin-left">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
              trend > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {(subtitle || changeLabel) && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors">
          {subtitle || changeLabel}
        </p>
      )}
    </div>
  );
};
