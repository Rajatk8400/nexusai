import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales/";
import Products from "./pages/Products";
import Analytics from "./pages/Analytics/index";
import Customers from "./pages/Customers/index";
import AIInsights from "./pages/AIInsights/index";
import Reports from "./pages/Reports/index";
import Settings from "./pages/Settings/index";
import Campaigns from "./pages/Campaigns/index";
import Expenses from "./pages/Expenses/index";
import Purchases from "./pages/Purchases/index";
import DocumentVault from "./pages/DocumentVault/index";
import BillingExpiredPage from "./pages/Billing/Expired";
import SuspendedPage from "./pages/Billing/Suspended";
import AdminDashboard from "./pages/Admin";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/billing/expired" element={<BillingExpiredPage />} />
        <Route path="/billing/suspended" element={<SuspendedPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="sales" element={<Sales />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="customers" element={<Customers />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="documents" element={<DocumentVault />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="reports" element={<Reports />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<Settings />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}