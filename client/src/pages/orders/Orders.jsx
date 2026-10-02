import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Sparkles,
  RefreshCw,
  Layers,
  Scale,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import OrdersTable from '../../features/orders/components/OrdersTable';
import EditOrderModal from '../../features/orders/components/EditOrderModal';
import WhatsAppReplyModal from '../../features/orders/components/WhatsAppReplyModal';
import ParseOrderModal from '../../features/orders/components/ParseOrderModal';
import {
  useOrdersQuery,
  useOrderMetricsQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation
} from '../../features/orders/hooks';

export default function Orders() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderForReply, setSelectedOrderForReply] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);

  // Queries & Mutations
  const { data: ordersData, isLoading, refetch, isFetching } = useOrdersQuery(filters);
  const { data: metricsData, refetch: refetchMetrics } = useOrderMetricsQuery();
  const { mutate: createOrder, isPending: isCreating } = useCreateOrderMutation();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrderMutation();
  const { mutate: deleteOrder } = useDeleteOrderMutation();

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenNewOrder = () => {
    setSelectedOrderForEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditOrder = (order) => {
    setSelectedOrderForEdit(order);
    setIsEditModalOpen(true);
  };

  const handleSaveOrder = (orderPayload) => {
    if (orderPayload.id) {
      updateOrder(orderPayload, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedOrderForEdit(null);
          refetchMetrics();
        }
      });
    } else {
      createOrder(orderPayload, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          refetchMetrics();
        }
      });
    }
  };

  const handleSaveParsedOrder = (parsedPayload, options = {}) => {
    createOrder(parsedPayload, {
      onSuccess: () => {
        if (options.onSuccess) options.onSuccess();
        refetchMetrics();
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Order #${id}?`)) {
      deleteOrder(id, {
        onSuccess: () => {
          refetchMetrics();
        }
      });
    }
  };

  const handleViewReply = (order) => {
    setSelectedOrderForReply(order);
    setIsReplyModalOpen(true);
  };

  const formatCurr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  const metrics = metricsData || {
    totalOrders: 0,
    confirmedOrders: 0,
    totalMeters: 0,
    totalWeightKg: 0,
    totalValue: 0
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Textile Orders & Calculations</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated WhatsApp order confirmation parsing, warp weight formulas, handling charges & live recalculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetch(); refetchMetrics(); }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Paste WhatsApp Message Button */}
          <button
            onClick={() => setIsParseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste WhatsApp Order</span>
          </button>

          {/* New Order Button */}
          <button
            onClick={handleOpenNewOrder}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</div>
            <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
              {metrics.totalOrders}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {metrics.confirmedOrders} Confirmed
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Meterage */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Fabric / Beam Length</div>
            <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
              {formatNum(metrics.totalMeters)} <span className="text-sm font-sans font-medium text-slate-500">M</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {metrics.totalBeams} Total Beams
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Yarn Weight */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Warp Yarn Weight</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              {formatNum(metrics.totalWeightKg)} <span className="text-sm font-sans font-medium text-slate-500">kg</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Warp Denier Calculation
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Estimated Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Order Book Value</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatCurr(metrics.totalValue)}
            </div>
            <div className="text-[11px] text-teal-600 mt-0.5">
              Yarn + Cartage + Out Beam
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={ordersData?.data || []}
        pagination={ordersData?.pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onEdit={handleOpenEditOrder}
        onViewReply={handleViewReply}
        onDelete={handleDelete}
      />

      {/* Edit / New Order Modal with Live Dynamic Recalculation */}
      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedOrderForEdit(null); }}
        order={selectedOrderForEdit}
        onSave={handleSaveOrder}
        isSaving={isCreating || isUpdating}
      />

      {/* WhatsApp Formatted Reply & Dispatch Modal */}
      <WhatsAppReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => { setIsReplyModalOpen(false); setSelectedOrderForReply(null); }}
        order={selectedOrderForReply}
      />

      {/* Paste & Parse WhatsApp Message Modal */}
      <ParseOrderModal
        isOpen={isParseModalOpen}
        onClose={() => setIsParseModalOpen(false)}
        onSaveOrder={handleSaveParsedOrder}
        isSaving={isCreating}
      />
    </div>
  );
}
