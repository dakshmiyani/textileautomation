import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import { previewParseOrder } from '../api';

const SAMPLE_WHATSAPP_MESSAGE = `શ્રી ગણેશાય નમઃ
*KESARI NANDAN TEX FAB*

*ORDER DETAILS*
DATE  : 28/09/2026
ORDER : SO-000274

*BILLING*
YOGI TEX FAB
Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130
GST NO: -

*ITEM DETAILS*
ITEM  : 21/1 NYLON BRIGHT MONO
ENDS  : 11808
PANNA : 54"

*PRICING*
*RATE    : 300++*
CARTAGE : ₹800 / Beam
*NOTE    : RS.400 WILL BE CHARGED ON EVERY OUT BEAM*

*BEAM DETAILS*
6   x  8550 METER
TOTAL BEAM : 6
*TOTAL MTR  : 51300 METER*

*TERMS*
15 DAYS NET BILL TO BILL
(1.5% interest after due date)

*DELIVERY*
Delivery after 7 Days

*IMPORTANT*
[NO FABRICS CLAIM]
[No Dyeing Guarantee]`;

export default function ParseOrderModal({ isOpen, onClose, onSaveOrder, isSaving }) {
  const [rawText, setRawText] = useState(SAMPLE_WHATSAPP_MESSAGE);
  const [parsedResult, setParsedResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const data = await previewParseOrder({ raw_message: rawText });
      if (!data) {
        setParseError('Could not recognize message as an order format. Please check structure.');
      } else {
        setParsedResult(data);
      }
    } catch (err) {
      setParseError(err.response?.data?.message || err.message || 'Failed to parse order text.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSave = () => {
    if (!parsedResult) return;
    onSaveOrder(
      {
        ...parsedResult,
        ...parsedResult.calculations,
        raw_message: rawText,
        source: 'WHATSAPP'
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const formatCurr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  const calc = parsedResult?.calculations;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-6 flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Paste & Parse WhatsApp Order Message</h3>
              <p className="text-xs text-slate-500">Automatically extracts items, beams, pricing & generates calculations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Raw WhatsApp Message Text:
            </label>
            <button
              type="button"
              onClick={() => { setRawText(SAMPLE_WHATSAPP_MESSAGE); setParsedResult(null); }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Paste Sample Kesari Nandan Order
            </button>
          </div>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => { setRawText(e.target.value); setParsedResult(null); }}
            placeholder="Paste order confirmation message here..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all leading-relaxed"
          />

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isParsing ? 'Parsing & Computing...' : 'Parse & Calculate'}</span>
            </button>

            {parseError && (
              <span className="text-xs text-rose-600 font-medium">{parseError}</span>
            )}
          </div>

          {/* Parsed Result Preview */}
          {parsedResult && calc && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-sm font-bold text-slate-800">Successfully Parsed Order #{parsedResult.order_no}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  {parsedResult.mill_name || 'KESARI NANDAN'}
                </span>
              </div>

              {/* Grid of Extracted Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] text-slate-400">Customer</div>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{parsedResult.customer_name || 'Asmita miyani'}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] text-slate-400">Buyer / Party</div>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{parsedResult.party_name}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] text-slate-400">Item Quality</div>
                  <div className="font-bold text-teal-800 truncate mt-0.5">{parsedResult.item_name}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] text-slate-400">GST / Tax No</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{parsedResult.gst_no || '-'}</div>
                </div>
              </div>

              {parsedResult.billing_address && (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                  <div className="text-[11px] text-slate-400">Billing Address</div>
                  <div className="text-slate-700 mt-0.5">{parsedResult.billing_address}</div>
                </div>
              )}

              {/* Calculated Metrics */}
              <div className="bg-slate-900 text-white rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[11px] text-teal-400 uppercase font-sans font-semibold">Denier</div>
                  <div className="text-base font-bold text-white mt-0.5">{calc.denier} D</div>
                </div>
                <div>
                  <div className="text-[11px] text-teal-400 uppercase font-sans font-semibold">Weight / Beam</div>
                  <div className="text-base font-bold text-white mt-0.5">{calc.weightPerBeamKg} kg</div>
                </div>
                <div>
                  <div className="text-[11px] text-teal-400 uppercase font-sans font-semibold">Total Warp Weight</div>
                  <div className="text-base font-bold text-white mt-0.5">{formatNum(calc.totalWeightKg)} kg</div>
                </div>
                <div>
                  <div className="text-[11px] text-emerald-400 uppercase font-sans font-semibold">Estimated Subtotal</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{formatCurr(calc.subtotal)}</div>
                </div>
              </div>

              {/* Financial Line Breakdown */}
              <div className="text-xs space-y-1.5 text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span>Yarn Basic Amount ({formatNum(calc.totalWeightKg)} kg @ {formatCurr(calc.rate)}):</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurr(calc.basicAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cartage Handling ({calc.beamCount} beams @ {formatCurr(calc.cartageRate)}):</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurr(calc.cartageTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Out Beam Handling ({calc.beamCount} beams @ {formatCurr(calc.outBeamRate)}):</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurr(calc.outBeamTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                  <span>Total Calculated (excl. GST):</span>
                  <span className="font-mono text-emerald-700">{formatCurr(calc.subtotal)}</span>
                </div>
              </div>

              {/* Save Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Order to ERP Database</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
