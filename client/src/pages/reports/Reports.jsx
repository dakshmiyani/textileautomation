import React from 'react';
import { BarChart3, FileSpreadsheet, Download } from 'lucide-react';
import ModulePlaceholder from '../common/ModulePlaceholder';
import { useExportExcelMutation } from '../../features/production/hooks';

export default function Reports() {
  const { mutate: exportExcel, isPending } = useExportExcelMutation();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Reports & BI</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Download production workbooks, efficiency analytics, and yarn consumption statements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Production Master Workbook */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Full Yarn Production Workbook (.xlsx)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete historical dump of all WhatsApp-ingested and manual yarn batches, with automated SUM and AVERAGE formula rows, styled headers, and column formatting.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => exportExcel({})}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isPending ? 'Generating Excel...' : 'Download Master Production Excel'}</span>
            </button>
          </div>
        </div>

        {/* Phase 4 BI Teaser */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Phase 4 Analytics
            </span>
            <h3 className="font-bold text-slate-800 text-sm mt-3">Loom Shed OEE & Shift Efficiency</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Automated Overall Equipment Effectiveness (OEE), shift-wise operator productivity benchmarking, warp breakage rate tracking, and waste ratio analytics.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-slate-400">
            Analytics engine scheduled for Phase 4 deployment
          </div>
        </div>
      </div>
    </div>
  );
}
