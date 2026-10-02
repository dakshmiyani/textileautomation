import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { Cpu, CheckCircle2, Activity, MapPin } from 'lucide-react';

export default function Machines() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const { data } = await apiClient.get('/machines');
      return data;
    }
  });

  const machines = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Factory Loom Machines</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered textile loom sheds and air-jet machines linked to production records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {machines.map((m) => (
          <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {m.code}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {m.status}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{m.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{m.type}</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-teal-600" /> Operational
              </span>
              <span>Loom Shed #1</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
