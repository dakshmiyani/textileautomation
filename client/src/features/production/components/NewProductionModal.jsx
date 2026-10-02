import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, AlertCircle } from 'lucide-react';
import { productionRecordSchema } from '../schemas';

export default function NewProductionModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productionRecordSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      yarn: '40s Combed Hosiery',
      ends: 1200,
      meter: 5000,
      panna: 63,
      total_beam: 10,
      contact_name: 'Manual Supervisor'
    }
  });

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    onSubmit(data, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">New Yarn Production Entry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Direct manual submission into the ERP database</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Production Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Worker / Operator</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                {...register('contact_name')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Yarn Count / Type *</label>
            <input
              type="text"
              placeholder="e.g. 40s Combed Hosiery"
              {...register('yarn')}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {errors.yarn && <p className="text-xs text-rose-500 mt-1">{errors.yarn.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ends *</label>
              <input
                type="number"
                placeholder="e.g. 1200"
                {...register('ends')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
              {errors.ends && <p className="text-xs text-rose-500 mt-1">{errors.ends.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meter *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 5000"
                {...register('meter')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
              {errors.meter && <p className="text-xs text-rose-500 mt-1">{errors.meter.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Panna (Beam Width) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 63"
                {...register('panna')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
              {errors.panna && <p className="text-xs text-rose-500 mt-1">{errors.panna.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Beam *</label>
              <input
                type="number"
                placeholder="e.g. 10"
                {...register('total_beam')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
              {errors.total_beam && <p className="text-xs text-rose-500 mt-1">{errors.total_beam.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Batch Remarks</label>
            <textarea
              rows="2"
              placeholder="Optional notes or loom observations..."
              {...register('notes')}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Production Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
