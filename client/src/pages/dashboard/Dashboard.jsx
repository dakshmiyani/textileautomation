import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Factory, MessageSquare, ArrowRight, FileSpreadsheet, Plus } from 'lucide-react';
import ProductionKPIs from '../../features/production/components/ProductionKPIs';
import ProductionCharts from '../../features/production/components/ProductionCharts';
import ProductionTable from '../../features/production/components/ProductionTable';
import NewProductionModal from '../../features/production/components/NewProductionModal';
import {
  useProductionKPIsQuery,
  useProductionAnalyticsQuery,
  useProductionRecordsQuery,
  useCreateProductionMutation,
  useExportExcelMutation
} from '../../features/production/hooks';
import { useWhatsAppStatusQuery } from '../../features/whatsapp/hooks';

export default function Dashboard() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: kpis, isLoading: kpisLoading } = useProductionKPIsQuery();
  const { data: analytics, isLoading: analyticsLoading } = useProductionAnalyticsQuery(14);
  const { data: recordsData, isLoading: recordsLoading } = useProductionRecordsQuery(filters);
  const { data: whatsappData } = useWhatsAppStatusQuery();

  // Mutations
  const { mutate: createRecord, isPending: isCreating } = useCreateProductionMutation();
  const { mutate: exportExcel, isPending: isExporting } = useExportExcelMutation();

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = () => {
    exportExcel(filters);
  };

  const conn = whatsappData?.connection || {};
  const isConnected = conn.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase tracking-wider">
              Textile Operations Live
            </span>
            <span className="text-xs text-slate-400">• Automated Baileys Feed Active</span>
          </div>
          <h2 className="text-xl font-black mt-2 tracking-tight">Yarn Production Executive Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time telemetry and structured data collection from factory WhatsApp yarn messages, loom machines, and operator reports.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Production Entry</span>
          </button>

          <NavLink
            to="/whatsapp"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Gateway ({conn.status || 'OFFLINE'})</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <ProductionKPIs kpis={kpis} isLoading={kpisLoading} />

      {/* Recharts Production Charts */}
      <ProductionCharts analytics={analytics} isLoading={analyticsLoading} />

      {/* Recent Production Records Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Recent Yarn Production Batches</h3>
            <p className="text-xs text-slate-500">Live feed of incoming WhatsApp submissions and manual entries</p>
          </div>
          <NavLink
            to="/production"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>View Full Production Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <ProductionTable
          records={recordsData?.data || []}
          pagination={recordsData?.pagination}
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onExport={handleExport}
          onNewRecord={() => setIsModalOpen(true)}
          isExporting={isExporting}
        />
      </div>

      {/* New Production Modal */}
      <NewProductionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createRecord}
        isSubmitting={isCreating}
      />
    </div>
  );
}
