import React, { useState } from 'react';
import { Factory, Plus, FileSpreadsheet, RefreshCw } from 'lucide-react';
import ProductionTable from '../../features/production/components/ProductionTable';
import NewProductionModal from '../../features/production/components/NewProductionModal';
import {
  useProductionRecordsQuery,
  useCreateProductionMutation,
  useDeleteProductionMutation,
  useExportExcelMutation
} from '../../features/production/hooks';

export default function YarnProduction() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    source: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: recordsData, isLoading, refetch, isFetching } = useProductionRecordsQuery(filters);
  const { mutate: createRecord, isPending: isCreating } = useCreateProductionMutation();
  const { mutate: deleteRecord } = useDeleteProductionMutation();
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

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete production record #${id}? This will be recorded in audit logs.`)) {
      deleteRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Factory className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Yarn Production Records</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete database of manufactured yarn batches, beam metrics, and WhatsApp submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'Export to Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Production Record</span>
          </button>
        </div>
      </div>

      {/* Production Table */}
      <ProductionTable
        records={recordsData?.data || []}
        pagination={recordsData?.pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onDelete={handleDelete}
        onExport={handleExport}
        isExporting={isExporting}
      />

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
