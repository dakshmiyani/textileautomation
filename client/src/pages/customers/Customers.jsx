import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Phone, MapPin, Briefcase, Edit3, Trash2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import EditCustomerModal from './components/EditCustomerModal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/customers');
      if (res.data && res.data.success) {
        setCustomers(res.data.data);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setIsEditModalOpen(true);
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      const res = await apiClient.delete(`/customers/${id}`);
      if (res.data.success) {
        setCustomers(customers.filter(c => c.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  const handleSaveCustomer = async (id, data) => {
    try {
      if (id) {
        // Edit existing
        const res = await apiClient.put(`/customers/${id}`, data);
        if (res.data.success) {
          setCustomers(customers.map(c => c.id === id ? res.data.data : c));
          setIsEditModalOpen(false);
        }
      } else {
        // Add new
        const res = await apiClient.post(`/customers`, data);
        if (res.data.success) {
          setCustomers([res.data.data, ...customers]);
          setIsEditModalOpen(false);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save customer');
    }
  };

  const filteredCustomers = customers
    .filter(c => {
      const term = search.toLowerCase();
      return (
        (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
        (c.party_name && c.party_name.toLowerCase().includes(term)) ||
        (c.phone_number && c.phone_number.includes(term)) ||
        (c.gst_no && c.gst_no.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-teal-600" />
          Customers Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Manage your buyers, party names, billing addresses, and GST details.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, party, phone, or GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20"
            >
              <Users className="w-4 h-4" />
              Add Customer
            </button>
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-teal-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content area */}
        {error ? (
          <div className="p-12 text-center text-rose-500 font-medium">
            Error: {error}
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
            Loading customers...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Party / Customer</th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Details</th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Billing Address</th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">GST No</th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span>No customers found matching your search.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Party / Customer */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Briefcase className="w-4 h-4 text-teal-700" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{customer.party_name || 'Unknown Party'}</div>
                            {customer.customer_name && customer.customer_name !== customer.party_name && (
                              <div className="text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {customer.customer_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-4 px-4 font-medium">
                        {customer.phone_number ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[13px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {customer.phone_number}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No phone</span>
                        )}
                      </td>

                      {/* Billing Address */}
                      <td className="py-4 px-4">
                        {customer.billing_address ? (
                          <div className="flex items-start gap-1.5 text-slate-600 max-w-xs leading-relaxed text-[13px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate" title={customer.billing_address}>
                              {customer.billing_address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No address provided</span>
                        )}
                      </td>

                      {/* GST No */}
                      <td className="py-4 px-4">
                        {customer.gst_no && customer.gst_no !== '-' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded-md border border-slate-200">
                            {customer.gst_no}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Not available</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditClick(customer)}
                            className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit customer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(customer.id, customer.party_name || customer.customer_name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete customer"
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
        )}
      </div>

      <EditCustomerModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        customer={selectedCustomer} 
        onSave={handleSaveCustomer} 
      />
    </div>
  );
}
