import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { Shield, Clock, Search, Filter } from 'lucide-react';
import { formatDate } from '../../features/production/utils';

export default function AuditLogs() {
  const [params, setParams] = useState({ page: 1, limit: 20 });

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit', 'logs', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/audit', { params });
      return data;
    }
  });

  const logs = auditData?.data || [];
  const pagination = auditData?.pagination;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all user activities, production updates, Excel exports, and WhatsApp gateway events.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="erp-table-th">Timestamp</th>
                <th className="erp-table-th">User</th>
                <th className="erp-table-th">Module</th>
                <th className="erp-table-th">Action</th>
                <th className="erp-table-th">Entity & ID</th>
                <th className="erp-table-th">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-slate-400">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="erp-table-td">
                      <div className="font-medium text-slate-800">{formatDate(log.created_at)}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="erp-table-td">
                      <div className="font-semibold text-slate-800">{log.user_name || 'System / Service'}</div>
                      <div className="text-xs text-slate-400">{log.user_email || 'daemon'}</div>
                    </td>
                    <td className="erp-table-td">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {log.module}
                      </span>
                    </td>
                    <td className="erp-table-td font-semibold text-teal-800 font-mono text-xs">
                      {log.action}
                    </td>
                    <td className="erp-table-td text-xs text-slate-600">
                      {log.entity} #{log.entity_id || '-'}
                    </td>
                    <td className="erp-table-td text-xs font-mono text-slate-500">
                      {log.ip_address || '-'}
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
              Showing {logs.length} of {pagination.total} audit events
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-semibold text-slate-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
