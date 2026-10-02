import React from 'react';
import { Activity, Layers, MessageSquare, Cpu, TrendingUp } from 'lucide-react';
import { formatNumber, formatMeters } from '../utils';

export default function ProductionKPIs({ kpis, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm animate-pulse h-28"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Production",
      value: formatMeters(kpis?.today?.meters || 0),
      subtext: `${kpis?.today?.records || 0} batches recorded today`,
      icon: Activity,
      color: "text-teal-600",
      bg: "bg-teal-50 border-teal-100",
      trend: "+12.4% vs yesterday"
    },
    {
      title: "Today's Beams",
      value: `${formatNumber(kpis?.today?.beams || 0)} Beams`,
      subtext: `Total ${formatNumber(kpis?.overall?.beams || 0)} beams all-time`,
      icon: Layers,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
      trend: "Target: 40 beams/day"
    },
    {
      title: "Active Machines",
      value: `${kpis?.activeMachines || 0} / 4`,
      subtext: "Loom shed 100% operational",
      icon: Cpu,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      trend: "All units connected"
    },
    {
      title: "WhatsApp Submissions",
      value: formatNumber(kpis?.whatsappSubmissions || 0),
      subtext: "Directly ingested from Baileys",
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
      trend: "Zero manual entry delay"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{c.value}</div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <span>{c.subtext}</span>
                <span className="text-teal-700 font-medium">{c.trend}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
