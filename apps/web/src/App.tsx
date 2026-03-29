import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { initSocket } from '@/lib/socket'
import { ToastContainer } from '@/components/ui/ToastContainer'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

// Lazy-loaded pages for <150KB bundle target
const AuthPage = lazy(() => import('@/pages/AuthPage'))
const OTPPage = lazy(() => import('@/pages/OTPPage'))
const ProfileSetupPage = lazy(() => import('@/pages/ProfileSetupPage'))
const AppShell = lazy(() => import('@/pages/AppShell'))
const ChatListPage = lazy(() => import('@/pages/ChatListPage'))
const ChatWindowPage = lazy(() => import('@/pages/ChatWindowPage'))
const CatalogPage = lazy(() => import('@/pages/CatalogPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const SharedCartPage = lazy(() => import('@/pages/SharedCartPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const OrderManagerPage = lazy(() => import('@/pages/OrderManagerPage'))
const CatalogManagerPage = lazy(() => import('@/pages/CatalogManagerPage'))
const SharedCartCreatorPage = lazy(() => import('@/pages/SharedCartCreatorPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const BusinessSetupPage = lazy(() => import('@/pages/BusinessSetupPage'))

// New nav index pages
const ContactsPage = lazy(() => import('@/pages/ContactsPage'))
const CatalogsIndexPage = lazy(() => import('@/pages/CatalogsIndexPage'))
const CartsIndexPage = lazy(() => import('@/pages/CartsIndexPage'))

// Loading fallback
function Loading() {
  return (
    // <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
    //   <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    // </div>
    <></>
  )
}

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
      <Suspense fallback={<Loading />}>
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
              <Route path="/catalog/:businessId/product/:productId" element={<ProductDetailPage />} />
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
              <Route path="/business/setup" element={<BusinessSetupPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </Suspense>
    </BrowserRouter>
    </QueryClientProvider>
  )
}
