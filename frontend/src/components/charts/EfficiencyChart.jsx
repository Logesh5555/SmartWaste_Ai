import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const EfficiencyChart = ({ categoryBreakdown = {} }) => {
  const data = [
    { name: 'Organic', value: categoryBreakdown.organic || 0, color: '#10b981' },
    { name: 'Recyclable', value: categoryBreakdown.recyclable || 0, color: '#3b82f6' },
    { name: 'General', value: categoryBreakdown.general || 0, color: '#f59e0b' },
    { name: 'Hazardous', value: categoryBreakdown.hazardous || 0, color: '#ef4444' },
  ];

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Waste Category Distribution</h3>
          <p className="text-xs text-slate-500">Breakdown of registered bins by waste type</p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
