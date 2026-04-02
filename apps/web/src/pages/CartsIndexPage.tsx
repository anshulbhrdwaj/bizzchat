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
    <div className="flex-1 flex flex-col bg-[#F0F2F5] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 safe-area-top bg-[#075E54] text-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-[20px] font-bold tracking-tight">Your Carts</h1>
          <p className="text-[13px] text-white/70 mt-0.5">Active carts from businesses</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {isLoading ? (
          <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1"><div className="h-4 w-28 bg-gray-200 rounded mb-2" /><div className="h-3 w-20 bg-gray-100 rounded" /></div>
              </div>
            ))}
          </div>
        ) : !carts || carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="text-5xl mb-4">🛍️</span>
            <p className="text-[17px] font-semibold text-gray-800">No Active Carts</p>
            <p className="text-[14px] mt-1 text-gray-400">Browse a catalogue to start adding items.</p>
          </div>
        ) : (
          <div className="mx-4 mt-4 space-y-3">
            {carts.map((cart: any) => {
              const totalAmount = cart.items.reduce((sum: number, item: any) => {
                const price = item.variant?.priceOverride ?? item.product?.basePrice ?? 0;
                return sum + (Number(price) * item.quantity);
              }, 0);

              return (
                <div
                  key={cart.id}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/cart/${cart.businessId}`)}
                >
                  {/* Business Header */}
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-50">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-[#128C7E]/10">
                      {cart.business?.logoUrl ? (
                        <img src={cart.business.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm text-[#128C7E]">{getInitials(cart.business?.name || 'B')}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-semibold text-gray-900 truncate">{cart.business?.name || 'Business'}</p>
                      <p className="text-[13px] text-gray-400">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <p className="text-[12px] font-semibold text-[#128C7E]">Checkout</p>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M6 4L10 8L6 12" stroke="#128C7E" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="px-4 py-3.5">
                    <div className="flex flex-col gap-3">
                      {cart.items.slice(0, 3).map((item: any) => {
                        const price = item.variant?.priceOverride ?? item.product?.basePrice ?? 0;
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.product?.images?.[0]?.url ? (
                                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg opacity-40">🛍️</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] text-gray-900 truncate font-medium">{item.product?.name || 'Product'}</p>
                              {item.variant && <p className="text-[12px] text-gray-400 truncate mt-0.5">{item.variant.label}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-[14px] font-semibold text-gray-700">x{item.quantity}</p>
                              <p className="text-[12px] text-gray-400 mt-0.5">₹{(Number(price) * item.quantity).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        )
                      })}
                      {cart.items.length > 3 && (
                        <p className="text-[12px] text-gray-400 font-medium text-center pt-2 border-t border-gray-50">
                          + {cart.items.length - 3} more item{cart.items.length - 3 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
