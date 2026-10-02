import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import YarnProduction from '../pages/production/YarnProduction';
import WhatsAppDashboard from '../pages/whatsapp/WhatsAppDashboard';
import Inventory from '../pages/inventory/Inventory';
import Orders from '../pages/orders/Orders';
import Customers from '../pages/customers/Customers';
import Suppliers from '../pages/suppliers/Suppliers';
import Machines from '../pages/machines/Machines';
import Reports from '../pages/reports/Reports';
import AuditLogs from '../pages/audit/AuditLogs';
import Settings from '../pages/settings/Settings';
import TenantsManagement from '../pages/saas/TenantsManagement';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  // Public Auth Route
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        )
      }
    ]
  },

  // Protected Dashboard Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'production',
        element: <YarnProduction />
      },
      {
        path: 'whatsapp',
        element: <WhatsAppDashboard />
      },
      {
        path: 'inventory',
        element: <Inventory />
      },
      {
        path: 'orders',
        element: <Orders />
      },
      {
        path: 'customers',
        element: <Customers />
      },
      {
        path: 'suppliers',
        element: <Suppliers />
      },
      {
        path: 'machines',
        element: <Machines />
      },
      {
        path: 'reports',
        element: <Reports />
      },
      {
        path: 'audit',
        element: <AuditLogs />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'saas',
        element: <TenantsManagement />
      }
    ]
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]);
