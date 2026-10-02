import React from 'react';
import { Settings as SettingsIcon, Shield, Server, Bell, Database } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWhatsAppStatusQuery, useConnectWhatsAppMutation, useDisconnectWhatsAppMutation } from '../../features/whatsapp/hooks';

function WhatsAppStatusPanel() {
  const { data: response, isLoading } = useWhatsAppStatusQuery();
  const { mutate: connect, isPending: isConnecting } = useConnectWhatsAppMutation();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectWhatsAppMutation();
  
  if (isLoading) {
    return <div className="text-xs text-slate-500">Loading WhatsApp status...</div>;
  }

  const statusData = response?.data;
  const isConnected = statusData?.status === 'CONNECTED';
  
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between text-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {statusData?.status || 'DISCONNECTED'}
          </span>
        </div>
        
        {isConnected && (
          <>
            <div className="text-slate-600">
              <span className="font-medium text-slate-500">Connected Number: </span> 
              <span className="font-mono">{statusData?.number}</span>
            </div>
            <div className="text-slate-600">
              <span className="font-medium text-slate-500">Session Name: </span> 
              {statusData?.name}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {!isConnected && statusData?.qrDataUrl && (
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 mb-2">Scan QR Code to Connect</p>
            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <img src={statusData.qrDataUrl} alt="WhatsApp QR Code" className="w-48 h-48" />
            </div>
          </div>
        )}

        <div>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              disabled={isDisconnecting}
              className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold rounded-lg transition text-xs"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Gateway'}
            </button>
          ) : (
            <button
              onClick={() => connect()}
              disabled={isConnecting}
              className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-lg transition text-xs shadow-sm shadow-emerald-600/20"
            >
              {isConnecting ? 'Connecting...' : 'Initialize Connection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Configuration & RBAC</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global ERP tenant parameters, multi-factory settings, and role-based permissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Session & Role Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-4">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Active Operator Identity</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Name</span>
              <span className="font-semibold text-slate-900">{user?.name || 'Administrator'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="font-mono font-semibold text-slate-900">{user?.email || 'admin@textileerp.com'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Assigned Role</span>
              <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Granted Permissions</span>
              <span className="font-semibold text-slate-700">{user?.permissions?.length || 14} system rights</span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-4">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Backend Architecture</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Primary Database</span>
              <span className="font-semibold text-slate-900">PostgreSQL (Knex.js Repository)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">WhatsApp Engine</span>
              <span className="font-semibold text-slate-900">Baileys Multi-File Auth</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Export Engine</span>
              <span className="font-semibold text-slate-900">ExcelJS Streaming</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Multi-Factory Ready</span>
              <span className="font-semibold text-emerald-700">Company &gt; Factory &gt; Machine &gt; Production</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Gateway Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-4">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Gateway Status</span>
          </div>
          
          <WhatsAppStatusPanel />
        </div>
      </div>
    </div>
  );
}
