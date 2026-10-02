import React, { useState } from 'react';
import { useTenantsQuery, useCreateTenantMutation } from '../../features/saas/api';
import { Building2, Plus, Mail, Hash, Loader2 } from 'lucide-react';

export default function TenantsManagement() {
  const { data: tenants, isLoading, error } = useTenantsQuery();
  const createTenantMutation = useCreateTenantMutation();
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTenantMutation.mutateAsync(formData);
      setIsCreating(false);
      setFormData({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });
    } catch (err) {
      alert(err.message || 'Failed to create tenant');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading tenants...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">Error loading tenants: {error.message}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SaaS Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage active tenants and onboard new clients.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Onboard Client
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Onboard New Client</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Acme Textiles"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">URL Slug</label>
              <input 
                required
                type="text" 
                placeholder="e.g. acme-textiles"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Name</label>
              <input 
                required
                type="text" 
                placeholder="Admin user's name"
                value={formData.adminName}
                onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Email</label>
              <input 
                required
                type="email" 
                placeholder="admin@acme.com"
                value={formData.adminEmail}
                onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Password</label>
              <input 
                required
                type="password" 
                placeholder="Temporary password"
                value={formData.adminPassword}
                onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-teal-500 transition"
              />
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTenantMutation.isPending}
                className="bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {createTenantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants?.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${tenant.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {tenant.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{tenant.name}</h3>
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Hash className="w-4 h-4 shrink-0" />
                <span className="truncate">{tenant.slug}</span>
              </div>
              {tenant.email && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tenant.email}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
