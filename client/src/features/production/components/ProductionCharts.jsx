import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function ProductionCharts({ analytics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm h-80 animate-pulse"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm h-80 animate-pulse"></div>
      </div>
    );
  }

  const dailyData = analytics?.byDay || [];
  const yarnData = analytics?.byYarn || [];
  const colors = ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Daily Production Volume */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Daily Production Volume (Meters)</h3>
            <p className="text-xs text-slate-500">Aggregated yarn output over the last 14 days</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Daily Trend</span>
        </div>
        <div className="h-64">
          {dailyData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No production data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  formatter={(val) => [`${val.toLocaleString()} meters`, 'Output']}
                />
                <Bar dataKey="meters" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Production by Yarn Count */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Production by Yarn Count</h3>
            <p className="text-xs text-slate-500">Meters manufactured grouped by yarn specification</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Distribution</span>
        </div>
        <div className="h-64">
          {yarnData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No yarn breakdown available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yarnData} layout="vertical" margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="yarn" type="category" stroke="#64748b" fontSize={11} width={80} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  formatter={(val) => [`${val.toLocaleString()} meters`, 'Produced']}
                />
                <Bar dataKey="meters" radius={[0, 4, 4, 0]}>
                  {yarnData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
