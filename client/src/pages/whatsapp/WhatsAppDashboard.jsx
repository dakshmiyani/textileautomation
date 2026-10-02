import React, { useState } from 'react';
import ConnectionCard from '../../features/whatsapp/components/ConnectionCard';
import MessageLogsTable from '../../features/whatsapp/components/MessageLogsTable';
import {
  useWhatsAppStatusQuery,
  useConnectWhatsAppMutation,
  useDisconnectWhatsAppMutation,
  useReconnectWhatsAppMutation,
  useMessageLogsQuery
} from '../../features/whatsapp/hooks';
import { MessageSquare, RefreshCw, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export default function WhatsAppDashboard() {
  const [logFilters, setLogFilters] = useState({ page: 1, limit: 15, status: 'ALL' });

  // Status & Control
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useWhatsAppStatusQuery();
  const { mutate: connect, isPending: isConnecting } = useConnectWhatsAppMutation();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectWhatsAppMutation();
  const { mutate: reconnect, isPending: isReconnecting } = useReconnectWhatsAppMutation();

  // Message Logs
  const { data: logsData, isLoading: logsLoading } = useMessageLogsQuery(logFilters);

  const handleFilterChange = (newFilters) => {
    setLogFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage) => {
    setLogFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">WhatsApp Ingestion Gateway</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated Baileys daemon monitoring incoming yarn production messages and recording to PostgreSQL.
          </p>
        </div>

        <button
          onClick={() => refetchStatus()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Gateway Connection Card & QR Code */}
      <ConnectionCard
        statusData={statusData}
        isLoading={statusLoading}
        onConnect={() => connect()}
        onDisconnect={() => disconnect()}
        onReconnect={() => reconnect()}
        isConnecting={isConnecting}
        isDisconnecting={isDisconnecting}
        isReconnecting={isReconnecting}
      />

      {/* Message Architecture Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>Format Contract</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Must contain Yarn, Ends, Meter, Panna, and Total Beam. Non-production conversations are silently ignored.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Duplicate Protection</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tracks unique message IDs and sender fingerprints in a 3-minute grace window to eliminate duplicate looper entries.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Contact & Privacy Resolution</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Resolves privacy LIDs (@lid) to actual telephone numbers and maps phone address book contact names automatically.
          </p>
        </div>
      </div>

      {/* Message Logs Table */}
      <MessageLogsTable
        logs={logsData?.data || []}
        pagination={logsData?.pagination}
        filters={logFilters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
