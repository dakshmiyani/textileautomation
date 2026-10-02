import React from 'react';
import {
  MessageSquare,
  Power,
  RotateCw,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ShieldCheck
} from 'lucide-react';

export default function ConnectionCard({
  statusData,
  isLoading,
  onConnect,
  onDisconnect,
  onReconnect,
  isConnecting,
  isDisconnecting,
  isReconnecting
}) {
  const conn = statusData?.connection || {};
  const metrics = statusData?.metrics || {};

  const isConnected = conn.status === 'CONNECTED';
  const isQrReady = conn.status === 'QR_READY';
  const isActionLoading = isConnecting || isDisconnecting || isReconnecting;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Gateway Identity & Status */}
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : isQrReady
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">WhatsApp Baileys Gateway</h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : isQrReady
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? 'bg-emerald-500 animate-pulse'
                      : isQrReady
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                ></span>
                {conn.status || 'DISCONNECTED'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Active Session:{' '}
              <span className="font-semibold text-slate-700">{conn.sessionName || 'Primary Gateway'}</span>
              {conn.phoneNumber && (
                <span className="ml-2 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {conn.phoneNumber}
                </span>
              )}
            </p>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Multi-File Auth Stored</span>
              </div>
              <div>•</div>
              <div>
                Auto-reply:{' '}
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">"ok"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isActionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Power className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect WhatsApp'}</span>
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              disabled={isActionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <Power className="w-4 h-4" />
              <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
            </button>
          )}

          <button
            onClick={onReconnect}
            disabled={isActionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Restart socket"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
            <span>Reconnect</span>
          </button>
        </div>
      </div>

      {/* QR Code Presentation if Pairing Needed */}
      {isQrReady && conn.qrDataUrl && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center gap-6 bg-amber-50/50 p-5 rounded-xl border border-amber-100">
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm shrink-0">
            <img src={conn.qrDataUrl} alt="WhatsApp QR Code" className="w-44 h-44 rounded-lg" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Scan with WhatsApp to Link
            </h4>
            <ol className="text-xs text-amber-800 list-decimal list-inside space-y-1.5 mt-2">
              <li>Open WhatsApp on your mobile phone</li>
              <li>Tap <strong>Settings</strong> or <strong>Three Dots</strong> &gt; <strong>Linked Devices</strong></li>
              <li>Tap <strong>Link a Device</strong> and point your camera at this QR code</li>
              <li>Once paired, yarn production messages will ingest directly into PostgreSQL</li>
            </ol>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-center">
        <div className="bg-slate-50 p-3 rounded-xl">
          <div className="text-xs font-semibold text-slate-500">Total Received</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics.totalReceived || 0}</div>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl">
          <div className="text-xs font-semibold text-emerald-700">Valid & Processed</div>
          <div className="text-lg font-bold text-emerald-900 mt-0.5">{metrics.processed || 0}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-xl">
          <div className="text-xs font-semibold text-amber-700">Duplicates Filtered</div>
          <div className="text-lg font-bold text-amber-900 mt-0.5">{metrics.duplicate || 0}</div>
        </div>
        <div className="bg-slate-100/70 p-3 rounded-xl">
          <div className="text-xs font-semibold text-slate-600">Non-Production Ignored</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{metrics.ignored || 0}</div>
        </div>
      </div>
    </div>
  );
}
