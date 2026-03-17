import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import { LoginPage } from '@/pages/auth/LoginPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { HomePage } from '@/pages/home/HomePage'
import { StockPage } from '@/pages/stock/StockPage'
import { NewProductPage } from '@/pages/stock/NewProductPage'
import { StockScanPage } from '@/pages/stock/StockScanPage'
import { ProductDetailPage } from '@/pages/stock/ProductDetailPage'
import { NewSalePage } from '@/pages/sales/NewSalePage'
import { SalesPage } from '@/pages/sales/SalesPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage'
import { Navigate } from 'react-router-dom'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'stock', element: <StockPage /> },
      { path: 'stock/scan', element: <StockScanPage /> },
      { path: 'stock/new', element: <NewProductPage /> },
      { path: 'stock/:productId', element: <ProductDetailPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'sales/new', element: <NewSalePage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:customerId', element: <CustomerDetailPage /> },
      { path: 'credit', element: <Navigate to="/customers" replace /> },
      { path: 'credit/:customerId', element: <Navigate to="/customers" replace /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
