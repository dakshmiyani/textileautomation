import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { useSendOrderWhatsAppMutation } from '../hooks';

export default function WhatsAppReplyModal({ isOpen, onClose, order }) {
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(order?.whatsapp_number || '');
  const [sendSuccess, setSendSuccess] = useState(null);
  const [sendError, setSendError] = useState(null);

  const { mutate: sendReply, isPending: isSending } = useSendOrderWhatsAppMutation();

  React.useEffect(() => {
    if (order?.whatsapp_number) {
      setPhoneNumber(order.whatsapp_number);
    } else {
      setPhoneNumber('');
    }
    setSendSuccess(null);
    setSendError(null);
  }, [order]);

  if (!isOpen || !order) return null;

  const replyText = order.reply_message || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = () => {
    if (!phoneNumber) {
      setSendError('Please enter a valid WhatsApp phone number with country code (e.g. +91...)');
      return;
    }
    setSendError(null);
    setSendSuccess(null);

    sendReply(
      { id: order.id, phone: phoneNumber },
      {
        onSuccess: () => {
          setSendSuccess(`WhatsApp message sent successfully to ${phoneNumber}!`);
        },
        onError: (err) => {
          setSendError(err.response?.data?.message || err.message || 'Failed to send WhatsApp message. Ensure gateway is connected.');
        }
      }
    );
  };

  return (
    <div className="fixed -inset-10 z-50 flex items-center justify-center p-14 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl mx-auto">
        {/* Outer Close Button */}
       

        {/* Modal Content */}
        <div className="bg-white rounded-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">WhatsApp Confirmation & Calculations</h3>
                <p className="text-xs text-slate-500">Order #{order.order_no} • {order.party_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* WhatsApp Chat Preview Bubble */}
          <div className="bg-[#e7fedb] border border-emerald-200/80 rounded-2xl p-4 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner max-h-72 overflow-y-auto">
            {replyText}
          </div>

          {/* Feedback Alerts */}
          {sendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{sendSuccess}</span>
            </div>
          )}
          {sendError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{sendError}</span>
            </div>
          )}

          {/* Dispatch via Gateway */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Send directly via connected WhatsApp Gateway:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleSend}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send WhatsApp'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Requires active Baileys session in WhatsApp Gateway tab.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Reply Message'}</span>
          </button>

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
    </div>
  );
}

