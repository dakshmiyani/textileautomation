import React from 'react';
import {
  MessageSquare,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Sparkles
} from 'lucide-react';

export default function OrdersTable({
  orders = [],
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onEdit,
  onViewReply,
  onDelete,
  onQuickStatusChange
}) {
  const formatCurr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELIVERED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, party, yarn..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80">
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Order No & Date</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Buyer / Party</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Item & Denier</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Beams & Length</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Calculated Weight</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Pricing & Subtotal</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">Status</th>
              <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 text-slate-300" />
                    <span>No orders found matching filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Order & Date */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-slate-900">{o.order_no}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-sans">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{o.order_date || '-'}</span>
                    </div>
                  </td>

                  {/* Party */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{o.party_name}</div>
                    {o.customer_name && o.customer_name !== o.party_name && (
                      <div className="text-[11px] text-indigo-700 font-medium mt-0.5">👤 {o.customer_name}</div>
                    )}
                    {o.billing_address && (
                      <div className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate" title={o.billing_address}>
                        📍 {o.billing_address}
                      </div>
                    )}
                    {o.gst_no && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">GST: {o.gst_no}</div>
                    )}
                    {o.whatsapp_number && (
                      <div className="text-[10px] text-teal-600 font-mono mt-0.5">{o.whatsapp_number}</div>
                    )}
                  </td>

                  {/* Item */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-xs">
                      {o.item_name}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      Ends: <span className="font-semibold text-slate-700">{formatNum(o.ends)}</span> • Panna: {o.panna}"
                    </div>
                  </td>

                  {/* Beams & Meters */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900 text-sm">{formatNum(o.total_meters)} M</div>
                    <div className="text-[11px] text-indigo-600 mt-0.5">
                      {o.beam_count} Beams × {formatNum(o.meter_per_beam)} M
                    </div>
                  </td>

                  {/* Calculated Weight */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-teal-700 text-sm">
                      ~{formatNum(o.total_weight_kg)} kg
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {o.weight_per_beam_kg} kg/beam ({o.denier} D)
                    </div>
                  </td>

                  {/* Pricing Breakdown */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900 text-sm">{formatCurr(o.subtotal)}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      @{formatCurr(o.rate)} {o.rate_note || '++'} | Cart: {formatCurr(o.cartage_total)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadge(o.status)}`}>
                      {o.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* WhatsApp Reply Button */}
                      <button
                        onClick={() => onViewReply(o)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View WhatsApp reply & calculations"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit(o)}
                        className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit order & recalculate"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDelete(o.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
            Showing <span className="font-semibold text-slate-700">{orders.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> orders
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
