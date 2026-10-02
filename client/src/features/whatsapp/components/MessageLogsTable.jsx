import React from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, EyeOff, Filter } from 'lucide-react';
import { formatDate } from '../../production/utils';

export default function MessageLogsTable({
  logs,
  pagination,
  filters,
  onFilterChange,
  onPageChange
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Processed
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Duplicate
          </span>
        );
      case 'IGNORED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <EyeOff className="w-3 h-3" /> Non-Production
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Invalid Format
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">WhatsApp Inbound Message Logs</h3>
          <p className="text-xs text-slate-500">Real-time audit log of incoming WhatsApp messages and parser decisions</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROCESSED">Processed Only</option>
            <option value="DUPLICATE">Duplicates</option>
            <option value="IGNORED">Ignored</option>
            <option value="INVALID">Invalid</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sender, text..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="erp-table-th">Timestamp</th>
              <th className="erp-table-th">Sender Contact</th>
              <th className="erp-table-th">Phone Number</th>
              <th className="erp-table-th">Raw Message Content</th>
              <th className="erp-table-th">Status</th>
              <th className="erp-table-th">Production Saved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-sm text-slate-400">
                  No message logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="erp-table-td">
                    <div className="font-medium text-slate-800">{formatDate(log.created_at)}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="erp-table-td font-semibold text-slate-800">
                    {log.sender_name || 'WhatsApp User'}
                  </td>
                  <td className="erp-table-td font-mono text-xs text-slate-700">
                    {log.sender_number || '-'}
                  </td>
                  <td className="erp-table-td max-w-xs">
                    <div className="font-mono text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 truncate whitespace-pre">
                      {log.raw_content || '(empty)'}
                    </div>
                  </td>
                  <td className="erp-table-td">{getStatusBadge(log.status)}</td>
                  <td className="erp-table-td">
                    {log.production_record_id ? (
                      <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        #{log.production_record_id}: {log.yarn || 'Yarn'} ({log.meter || 0}m)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> logs
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
