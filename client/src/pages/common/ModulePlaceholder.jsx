import React from 'react';
import { Layers, Database, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ModulePlaceholder({ title, description, phase = 'Phase 2', icon: Icon = Layers }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Icon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          Scheduled for {phase}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title} Module Architecture Ready</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
          The foundation, PostgreSQL schema, Knex repository pattern, and API routing architecture are in place. Following the single-responsibility modular standard, this module will plug in without restructuring core logic.
        </p>

        <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>PostgreSQL Tables</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Knex Repository</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>RBAC Permission Hooks</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Event Bus Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
