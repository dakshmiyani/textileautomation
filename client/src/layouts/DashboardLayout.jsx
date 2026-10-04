import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  MessageSquare,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Cpu,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWhatsAppStatusQuery } from '../features/whatsapp/hooks';

const NAV_ITEMS = [
  { label: 'ERP Overview', path: '/dashboard', icon: LayoutDashboard, permission: 'production.read' },
  { label: 'Order Records', path: '/production', icon: Factory, permission: 'production.read' },
  { label: 'WhatsApp Gateway', path: '/whatsapp', icon: MessageSquare, permission: 'whatsapp.read' },
  { label: 'Inventory', path: '/inventory', icon: Package, permission: 'inventory.read' },
  { label: 'Orders & Calculations', path: '/orders', icon: ShoppingCart, permission: 'production.read' },
  { label: 'Customers', path: '/customers', icon: Users, permission: 'production.read' },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, permission: 'production.read' },
  { label: 'Loom Machines', path: '/machines', icon: Cpu, permission: 'production.read' },
  { label: 'Reports & Exports', path: '/reports', icon: BarChart3, permission: 'reports.read' },
  { label: 'Audit Trail', path: '/audit', icon: Shield, permission: 'audit.read' },
  { label: 'System Settings', path: '/settings', icon: Settings, permission: 'users.manage' }
];

export default function DashboardLayout() {
  const { user, logout, sidebarOpen, toggleSidebar, hasPermission, activeTenant, setActiveTenant, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Live status for WhatsApp pill in header
  const { data: whatsappData } = useWhatsAppStatusQuery();
  const conn = whatsappData?.connection || {};
  const isConnected = conn.status === 'CONNECTED';

  // Filter navigation items strictly based on user permissions or super_admin
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  if (isSaasOwner) {
    visibleNavItems.push({ label: 'SaaS Management', path: '/saas', icon: Globe });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 z-30 shrink-0 select-none`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
              T
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <div className="font-bold text-white tracking-tight text-sm leading-tight">TEXTILE ERP</div>
                <div className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">Production Suite</div>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-500 rounded-r-full"></span>
                )}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} p-2 rounded-xl bg-slate-800/50`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              {sidebarOpen && (
                <div className="truncate text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</div>
                  <div className="text-[10px] text-teal-400 font-mono uppercase">{activeTenant?.role_name || user?.role || 'SUPER_ADMIN'}</div>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-700 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-slate-800">
              {visibleNavItems.find((n) => location.pathname.startsWith(n.path))?.label || 'Textile Enterprise ERP'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* WhatsApp Gateway Status Pill */}
            <NavLink
              to="/whatsapp"
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click to manage WhatsApp gateway"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                WhatsApp: {conn.status || 'CONNECTING'}
              </span>
            </NavLink>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-slate-800 leading-tight">{user?.name || 'Admin'}</div>
                <div className="text-[10px] text-slate-400 font-mono">{activeTenant?.role_name || user?.role}</div>
              </div>
            </div>

            {/* Tenant Switcher */}
            {user?.tenants && user.tenants.length > 0 && (
              <div className="flex items-center pl-2 border-l border-slate-200">
                <select
                  value={activeTenant?.id || ''}
                  onChange={(e) => {
                    setActiveTenant(parseInt(e.target.value, 10));
                    window.location.reload(); // Reload to fetch fresh data for the new tenant
                  }}
                  className="bg-slate-100 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {user.tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
