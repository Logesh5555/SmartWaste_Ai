import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const WardWasteBarChart = ({ data = [] }) => {
  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Ward-wise Average Fill Level</h3>
          <p className="text-xs text-slate-500">Utilization percentage across municipal administrative zones</p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
            <YAxis
              dataKey="ward"
              type="category"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              width={110}
              tickFormatter={(val) => val.split(' ')[0]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '12px',
              }}
            />
            <Bar
              dataKey="averageFillPercentage"
              name="Avg Fill (%)"
              fill="#10b981"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
