import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Save, RefreshCw, MessageSquare, Send, Check, AlertCircle } from 'lucide-react';
import { calculateOrderMetrics, formatOrderReply } from '../orderCalculations';
import { useSendOrderWhatsAppMutation } from '../hooks';

export default function EditOrderModal({ isOpen, onClose, order, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    order_no: '',
    order_date: '',
    mill_name: 'KESARI NANDAN TEX FAB',
    customer_name: '',
    party_name: '',
    billing_address: '',
    gst_no: '',
    item_name: '',
    ends: 11808,
    panna: 54,
    denier: 21,
    beam_count: 6,
    meter_per_beam: 8550,
    total_meters: 51300,
    rate: 300,
    rate_type: 'PER_KG',
    rate_note: '++',
    cartage_rate: 800,
    out_beam_rate: 400,
    gst_percent: 0,
    status: 'CONFIRMED',
    delivery: 'Delivery after 7 Days',
    terms: '15 DAYS NET BILL TO BILL (1.5% interest after due date)',
    notes: '[NO FABRICS CLAIM] [No Dyeing Guarantee]',
    whatsapp_number: ''
  });

  const { mutate: sendReply, isPending: isSendingWhatsApp } = useSendOrderWhatsAppMutation();
  const [sendSuccess, setSendSuccess] = useState(null);
  const [sendError, setSendError] = useState(null);

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    if (!order?.id) {
      setSendError("Please save the order first before sending.");
      return;
    }
    if (!formData.whatsapp_number) {
      setSendError("Please enter a valid Party WhatsApp number.");
      return;
    }

    setSendError(null);
    setSendSuccess(null);

    sendReply(
      { id: order.id, phone: formData.whatsapp_number },
      {
        onSuccess: () => setSendSuccess(`Sent successfully to ${formData.whatsapp_number}!`),
        onError: (err) => setSendError(err.response?.data?.message || err.message || 'Failed to send.')
      }
    );
  };

  useEffect(() => {
    if (order) {
      setFormData({
        order_no: order.order_no || '',
        order_date: order.order_date || '',
        mill_name: order.mill_name || 'KESARI NANDAN TEX FAB',
        customer_name: order.customer_name || '',
        party_name: order.party_name || '',
        billing_address: order.billing_address || "Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130",
        gst_no: order.gst_no || '',
        item_name: order.item_name || '',
        ends: order.ends || 0,
        panna: order.panna || 0,
        denier: order.denier || 21,
        beam_count: order.beam_count || 1,
        meter_per_beam: order.meter_per_beam || 0,
        total_meters: order.total_meters || 0,
        rate: order.rate || 0,
        rate_type: order.rate_type || 'PER_KG',
        rate_note: order.rate_note || '++',
        cartage_rate: order.cartage_rate || 0,
        out_beam_rate: order.out_beam_rate || 0,
        gst_percent: order.gst_percent || 0,
        status: order.status || 'CONFIRMED',
        delivery: order.delivery || '',
        terms: order.terms || '',
        notes: order.notes || '',
        whatsapp_number: order.whatsapp_number || ''
      });

      // Automatically fetch the customer to correct the party_name if they match in the db
      import('../../../services/apiClient').then(({ default: apiClient }) => {
        apiClient.get('/customers').then(res => {
          if (res.data?.success) {
            const cust = res.data.data.find(
              c => (order.whatsapp_number && c.phone_number === order.whatsapp_number) || 
                   (order.customer_name && c.customer_name === order.customer_name)
            );
            if (cust) {
              setFormData(prev => ({
                ...prev,
                party_name: cust.party_name || prev.party_name,
                customer_name: cust.customer_name || prev.customer_name,
                billing_address: cust.billing_address || prev.billing_address,
                gst_no: cust.gst_no || prev.gst_no
              }));
            }
          }
        }).catch(() => {});
      });
    }
  }, [order]);

  // Live recalculation based on current form inputs
  const liveCalc = useMemo(() => {
    return calculateOrderMetrics(formData);
  }, [formData]);

  const liveReply = useMemo(() => {
    return formatOrderReply(formData, liveCalc);
  }, [formData, liveCalc]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      
      // Auto-update total meters when beam count or meter_per_beam changes
      if (field === 'beam_count' || field === 'meter_per_beam') {
        const beams = field === 'beam_count' ? parseInt(value, 10) || 0 : parseInt(prev.beam_count, 10) || 0;
        const meter = field === 'meter_per_beam' ? parseFloat(value) || 0 : parseFloat(prev.meter_per_beam) || 0;
        if (beams > 0 && meter > 0) {
          next.total_meters = beams * meter;
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...(order ? { id: order.id } : {}),
      ...formData,
      ...liveCalc,
      reply_message: liveReply
    });
  };

  const formatCurr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="fixed -inset-10 z-50 flex items-start justify-center pt-14 pb-14 px-14 sm:px-16 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-6xl m-auto">
        {/* Modal Content */}
        <div className="bg-white rounded-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {order ? `Edit Order #${formData.order_no}` : 'New Order & Calculation'}
                </h3>
                <p className="text-xs text-slate-500">Live dynamic recalculation for textile warp, beam metrics & billing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        {/* Form Body - 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Order & Billing */}
            <div className="space-y-4">
              
              {/* Order & Party Header */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Order & Billing Details
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Order No *</label>
                    <input
                      type="text"
                      required
                      value={formData.order_no}
                      onChange={(e) => handleChange('order_no', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Order Date</label>
                    <input
                      type="text"
                      value={formData.order_date}
                      onChange={(e) => handleChange('order_date', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Customer / Sender Name</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => handleChange('customer_name', e.target.value)}
                      placeholder="e.g. Asmita Miyani"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Buyer / Party Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.party_name}
                      onChange={(e) => handleChange('party_name', e.target.value)}
                      placeholder="e.g. YOGI TEX FAB"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Billing Address</label>
                    <input
                      type="text"
                      value={formData.billing_address}
                      onChange={(e) => handleChange('billing_address', e.target.value)}
                      placeholder="Plot No. 12-13, Surat..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">GSTIN / Tax No</label>
                    <input
                      type="text"
                      value={formData.gst_no}
                      onChange={(e) => handleChange('gst_no', e.target.value)}
                      placeholder="24AAAAA0000A1Z5"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Reply Live Preview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Message Preview</span>
                  </div>
                </div>
                <div className="bg-[#e7fedb] border border-emerald-200 rounded-xl p-3 text-[11px] font-mono text-slate-800 leading-snug whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
                  {liveReply}
                </div>
                
                {/* Send Button & Alerts */}
                <div className="space-y-2 pt-1">
                  {sendSuccess && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-lg flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{sendSuccess}</span>
                    </div>
                  )}
                  {sendError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{sendError}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    disabled={isSendingWhatsApp || !order?.id || !formData.whatsapp_number}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isSendingWhatsApp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isSendingWhatsApp ? 'Sending...' : (order?.id ? 'Send WhatsApp Message' : 'Save Order to Send')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Technical Specs & Pricing */}
            <div className="space-y-4">

              {/* Technical Item & Beam Specifications */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Warp & Beam Specifications</span>
                  <span className="text-[10px] text-teal-600 font-normal">Denier Formula Auto-Applied</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Item / Yarn Quality *</label>
                    <input
                      type="text"
                      required
                      value={formData.item_name}
                      onChange={(e) => handleChange('item_name', e.target.value)}
                      placeholder="e.g. 21/1 NYLON BRIGHT MONO"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Denier (D)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.denier}
                      onChange={(e) => handleChange('denier', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-teal-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Ends (Tar) *</label>
                    <input
                      type="number"
                      required
                      value={formData.ends}
                      onChange={(e) => handleChange('ends', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Panna (Width ")</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.panna}
                      onChange={(e) => handleChange('panna', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Total Beams</label>
                    <input
                      type="number"
                      value={formData.beam_count}
                      onChange={(e) => handleChange('beam_count', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-indigo-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Meters / Beam</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.meter_per_beam}
                      onChange={(e) => handleChange('meter_per_beam', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Total Length (Meters) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.total_meters}
                      onChange={(e) => handleChange('total_meters', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing, Cartage & Out Beam Charges */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Pricing & Handling Charges
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Rate (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.rate}
                      onChange={(e) => handleChange('rate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Rate Unit</label>
                    <select
                      value={formData.rate_type}
                      onChange={(e) => handleChange('rate_type', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="PER_KG">Per Kg (Yarn)</option>
                      <option value="PER_METER">Per Meter (Fabric)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Rate Note</label>
                    <input
                      type="text"
                      value={formData.rate_note}
                      onChange={(e) => handleChange('rate_note', e.target.value)}
                      placeholder="e.g. ++"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Cartage (₹/Beam)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.cartage_rate}
                      onChange={(e) => handleChange('cartage_rate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Out Beam (₹/Beam)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.out_beam_rate}
                      onChange={(e) => handleChange('out_beam_rate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">GST %</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.gst_percent}
                      onChange={(e) => handleChange('gst_percent', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Party WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp_number}
                      onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                      placeholder="+91..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Column 3: Live Dynamic Calculations & WhatsApp Preview */}
            <div className="space-y-4 flex flex-col">
              
              {/* Live Technical Metrics Card */}
              <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-teal-800/40 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Real-time Calculation</span>
                  </div>
                  <span className="text-[10px] bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-full font-mono">
                    LIVE RECALC
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[11px] text-slate-400">Weight / Beam</div>
                    <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                      ~{liveCalc.weightPerBeamKg} <span className="text-xs font-normal">kg</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[11px] text-slate-400">Total Yarn Weight</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      ~{formatNum(liveCalc.totalWeightKg)} <span className="text-xs font-normal">kg</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 text-xs border-t border-white/10 pt-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Basic Amount (@ {formatCurr(liveCalc.rate)}/{liveCalc.rateType === 'PER_METER' ? 'm' : 'kg'}):</span>
                    <span className="font-mono font-medium text-white">{formatCurr(liveCalc.basicAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cartage ({liveCalc.beamCount} @ {formatCurr(liveCalc.cartageRate)}):</span>
                    <span className="font-mono font-medium text-white">{formatCurr(liveCalc.cartageTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Out Beam ({liveCalc.beamCount} @ {formatCurr(liveCalc.outBeamRate)}):</span>
                    <span className="font-mono font-medium text-white">{formatCurr(liveCalc.outBeamTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-white/10 pt-2 font-semibold">
                    <span className="text-teal-200">Subtotal ({liveCalc.rateNote}):</span>
                    <span className="font-mono text-teal-300 text-sm">{formatCurr(liveCalc.subtotal)}</span>
                  </div>
                  {liveCalc.gstAmount > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>GST ({liveCalc.gstPercent}%):</span>
                      <span className="font-mono text-white">{formatCurr(liveCalc.gstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white border-t border-white/20 pt-2 font-bold text-sm">
                    <span>Estimated Total:</span>
                    <span className="font-mono text-emerald-400 text-base">{formatCurr(liveCalc.grandTotal)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{order ? 'Save Changes & Recalculate' : 'Create Order & Recalculate'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
