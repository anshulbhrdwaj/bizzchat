import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { initSocket } from '@/lib/socket'
import { ToastContainer } from '@/components/ui/ToastContainer'

import AuthPage from '@/pages/AuthPage'
import OTPPage from '@/pages/OTPPage'
import ProfileSetupPage from '@/pages/ProfileSetupPage'
import AppShell from '@/pages/AppShell'
import ChatListPage from '@/pages/ChatListPage'
import ChatWindowPage from '@/pages/ChatWindowPage'
import CatalogPage from '@/pages/CatalogPage'
import CartPage from '@/pages/CartPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import SharedCartPage from '@/pages/SharedCartPage'
import DashboardPage from '@/pages/DashboardPage'
import OrderManagerPage from '@/pages/OrderManagerPage'
import CatalogManagerPage from '@/pages/CatalogManagerPage'
import SharedCartCreatorPage from '@/pages/SharedCartCreatorPage'
import SettingsPage from '@/pages/SettingsPage'
import BusinessSetupPage from '@/pages/BusinessSetupPage'
import ProfileEditPage from '@/pages/ProfileEditPage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import TermsPage from '@/pages/TermsPage'
import ContactsPage from '@/pages/ContactsPage'
import CatalogsIndexPage from '@/pages/CatalogsIndexPage'
import CartsIndexPage from '@/pages/CartsIndexPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

// Route guards
function AuthGuard() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <Outlet />
}

function BusinessGuard() {
  const { isAuthenticated } = useAuthStore()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    import('@/lib/api').then(({ default: apiClient }) => {
      apiClient.get('/business/profile')
        .then(() => setHasProfile(true))
        .catch(() => setHasProfile(false))
    })
  }, [isAuthenticated])

  if (hasProfile === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#128C7E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!hasProfile) return <Navigate to="/business/setup" replace />
  return <Outlet />
}

export default function App() {
  const { isAuthenticated, accessToken } = useAuthStore()

  // Initialize socket on auth
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initSocket(accessToken)
    }
  }, [isAuthenticated, accessToken])

  // Dark mode detection
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    document.documentElement.classList.toggle('dark', prefersDark.matches)
    prefersDark.addEventListener('change', handler)
    return () => prefersDark.removeEventListener('change', handler)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <div className="mesh-bg" />
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/otp" element={<OTPPage />} />
        <Route path="/auth/profile" element={<ProfileSetupPage />} />

        {/* Protected */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/chats" replace />} />
            <Route path="/chats" element={<ChatListPage />} />
            <Route path="/chats/:chatId" element={<ChatWindowPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/catalog" element={<CatalogsIndexPage />} />
            <Route path="/catalog/:businessId" element={<CatalogPage />} />
            <Route path="/cart" element={<CartsIndexPage />} />
            <Route path="/cart/:businessId" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/shared-cart/:id" element={<SharedCartPage />} />

            {/* Business owner only */}
            <Route element={<BusinessGuard />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/orders" element={<OrderManagerPage />} />
              <Route path="/dashboard/catalog" element={<CatalogManagerPage />} />
              <Route path="/dashboard/shared-cart/new" element={<SharedCartCreatorPage />} />
            </Route>

            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/profile" element={<ProfileEditPage />} />
            <Route path="/settings/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/settings/terms" element={<TermsPage />} />
            <Route path="/business/setup" element={<BusinessSetupPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
    </QueryClientProvider>
  )
}
