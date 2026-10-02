import React from 'react';
import {
  MessageSquare,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Clock,
  ArrowUpDown,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { formatNumber, formatMeters, formatDate } from '../utils';

export default function ProductionTable({
  records,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onDelete,
  onExport,
  onNewRecord,
  isExporting
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search yarn, worker, phone..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source filter */}
          <select
            value={filters.source || 'ALL'}
            onChange={(e) => onFilterChange({ source: e.target.value, page: 1 })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Sources</option>
            <option value="WHATSAPP">WhatsApp Only</option>
            <option value="MANUAL">Manual Only</option>
          </select>

          {/* Export to Excel */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
            title="Download formatted .xlsx workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>

          {/* Add Manual Record */}
          {onNewRecord && (
            <button
              onClick={onNewRecord}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="erp-table-th">Date & Time</th>
              <th className="erp-table-th">Yarn Specification</th>
              <th className="erp-table-th text-right">Ends</th>
              <th className="erp-table-th text-right">Meter</th>
              <th className="erp-table-th text-right">Panna (Width)</th>
              <th className="erp-table-th text-right">Total Beam</th>
              <th className="erp-table-th">Worker / Contact</th>
              <th className="erp-table-th">Source</th>
              <th className="erp-table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-sm text-slate-400">
                  No production records found matching filters.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="erp-table-td">
                    <div className="font-medium text-slate-800">{formatDate(r.date)}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{r.time || '-'}</span>
                    </div>
                  </td>
                  <td className="erp-table-td">
                    <span className="font-semibold text-teal-800 bg-teal-50/80 px-2 py-0.5 rounded text-xs">
                      {r.yarn}
                    </span>
                    {r.machine_code && (
                      <div className="text-xs text-slate-400 mt-1">Machine: {r.machine_code}</div>
                    )}
                  </td>
                  <td className="erp-table-td text-right font-mono font-medium text-slate-700">
                    {formatNumber(r.ends)}
                  </td>
                  <td className="erp-table-td text-right font-mono font-bold text-slate-900">
                    {formatMeters(r.meter)}
                  </td>
                  <td className="erp-table-td text-right font-mono text-slate-600">
                    {formatNumber(r.panna, 1)}"
                  </td>
                  <td className="erp-table-td text-right font-mono font-medium text-indigo-700">
                    {formatNumber(r.total_beam)}
                  </td>
                  <td className="erp-table-td">
                    <div className="font-medium text-slate-800">{r.contact_name || 'Worker'}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.whatsapp_number || '-'}</div>
                  </td>
                  <td className="erp-table-td">
                    {r.source === 'WHATSAPP' ? (
                      <span className="badge-whatsapp">
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </span>
                    ) : (
                      <span className="badge-manual">
                        <span>Manual</span>
                      </span>
                    )}
                  </td>
                  <td className="erp-table-td text-right">
                    {onDelete && (
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{records.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> total entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
