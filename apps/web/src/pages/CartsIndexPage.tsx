import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

export default function CartsIndexPage() {
  const navigate = useNavigate()

  const { data: carts, isLoading } = useQuery({
    queryKey: ['carts', 'all'],
    queryFn: async () => { const { data } = await apiClient.get('/cart/all'); return data }
  })

  return (
    <div className="flex-1 flex flex-col bg-white">
      <header className="shrink-0 safe-area-top bg-[#075E54] text-white">
        <div className="px-4 py-3">
          <h1 className="text-[20px] font-medium">Your Carts</h1>
          <p className="text-[13px] text-white/70">Active carts from businesses</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-4 bg-[#F0F2F5]">
        {isLoading ? (
          <div className="space-y-0 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1"><div className="h-4 w-28 bg-gray-100 rounded mb-2" /><div className="h-3 w-20 bg-gray-50 rounded" /></div>
              </div>
            ))}
          </div>
        ) : !carts || carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="text-4xl mb-4">🛍️</span>
            <p className="text-[15px] font-medium text-gray-900">No Active Carts</p>
            <p className="text-[14px] mt-1 text-gray-500">You don't have any items in any business carts yet.</p>
          </div>
        ) : (
          carts.map((cart: any) => {
            const totalAmount = cart.items.reduce((sum: number, item: any) => {
              const price = item.variant?.priceOverride ?? item.product?.basePrice ?? 0;
              return sum + (Number(price) * item.quantity);
            }, 0);

            return (
              <div key={cart.id} className="mb-3 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer active:bg-gray-50 transition-colors" onClick={() => navigate(`/cart/${cart.businessId}`)}>
                {/* Business Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#128C7E]/10">
                    {cart.business?.logoUrl ? (
                      <img src={cart.business.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm text-[#128C7E]">{getInitials(cart.business?.name || 'B')}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium text-gray-900 truncate">{cart.business?.name || 'Business'}</p>
                    <p className="text-[13px] text-gray-500">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-[#111B21]">₹{totalAmount.toLocaleString('en-IN')}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-[#128C7E]">
                      <p className="text-[12px] font-medium">Checkout</p>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Items Preview List */}
                <div className="px-4 py-3 pb-4">
                  <div className="flex flex-col gap-3">
                    {cart.items.slice(0, 3).map((item: any) => {
                      const price = item.variant?.priceOverride ?? item.product?.basePrice ?? 0;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.product?.images?.[0]?.url ? (
                              <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl opacity-50">🛍️</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-gray-900 truncate font-medium">{item.product?.name || 'Product'}</p>
                            {item.variant ? (
                              <p className="text-[12px] text-gray-500 truncate mt-0.5">{item.variant.label}</p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] text-gray-900 font-medium">x{item.quantity}</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">₹{(Number(price) * item.quantity).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      )
                    })}
                    {cart.items.length > 3 && (
                      <p className="text-[13px] text-gray-400 font-medium text-center mt-1 pt-2 border-t border-gray-50">
                        + {cart.items.length - 3} more item{cart.items.length - 3 !== 1 ? 's' : ''} in cart
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
