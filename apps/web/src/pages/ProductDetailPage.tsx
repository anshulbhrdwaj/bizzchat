import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export default function ProductDetailPage() {
  const { businessId, productId } = useParams();
  const navigate = useNavigate();
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, number>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [initialCartItems, setInitialCartItems] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const { data: cart } = useQuery({
    queryKey: ["cart", businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cart?businessId=${businessId}`);
      return data;
    },
    enabled: !!businessId,
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/products/${productId}`);
      return data;
    },
    enabled: !!productId,
  });

  const hasVariants = (product?.variantGroups || []).length > 0;
  const totalVariantQuantity = Object.values(variantQuantities).reduce(
    (a, b) => a + b,
    0,
  );
  const totalItemsCount = hasVariants ? totalVariantQuantity : quantity;
  const maxStock = 99;

  useEffect(() => {
    if (product && cart !== undefined && !initialized) {
      if (cart) {
        const items = cart.items?.filter((i: any) => i.productId === product.id) || [];
        if (items.length > 0) {
          setInitialCartItems(items);
          if ((product.variantGroups || []).length > 0) {
            const vQs: Record<string, number> = {};
            items.forEach((i: any) => {
              if (i.variantId) vQs[i.variantId] = i.quantity;
            });
            setVariantQuantities(vQs);
          } else {
            setQuantity(items[0].quantity);
          }
        }
      }
      setInitialized(true);
    }
  }, [product, cart, initialized]);

  // Compute display price and "From" logic
  const { displayPrice, isFrom } = useMemo(() => {
    if (!product) return { displayPrice: 0, isFrom: false };

    const basePrice = Number(product.basePrice);
    let allPrices: number[] = [basePrice];
    let hasVariance = false;

    for (const group of product.variantGroups || []) {
      for (const val of group.values) {
        if (val.priceOverride && Number(val.priceOverride) !== basePrice) {
          allPrices.push(Number(val.priceOverride));
          hasVariance = true;
        }
      }
    }
    return { displayPrice: Math.min(...allPrices), isFrom: hasVariance };
  }, [product]);

  const handleAddToCart = async () => {
    if (totalItemsCount === 0 && initialCartItems.length === 0) return;
    setAddingToCart(true);
    try {
      const requests = [];
      if (hasVariants) {
        for (const [vId, qty] of Object.entries(variantQuantities)) {
          const initialItem = initialCartItems.find((i) => i.variantId === vId);
          if (initialItem) {
            if (qty !== initialItem.quantity) {
              if (qty === 0) {
                requests.push(apiClient.delete(`/cart/items/${initialItem.id}`));
              } else {
                requests.push(apiClient.put(`/cart/items/${initialItem.id}`, { quantity: qty }));
              }
            }
          } else if (qty > 0) {
            requests.push(apiClient.post(`/cart/items`, { businessId, productId, variantId: vId, quantity: qty }));
          }
        }
        initialCartItems.forEach((initialItem) => {
          if (variantQuantities[initialItem.variantId!] === undefined) {
            requests.push(apiClient.delete(`/cart/items/${initialItem.id}`));
          }
        });
      } else {
        const initialItem = initialCartItems[0];
        if (initialItem) {
          if (quantity !== initialItem.quantity) {
            if (quantity === 0) {
              requests.push(apiClient.delete(`/cart/items/${initialItem.id}`));
            } else {
              requests.push(apiClient.put(`/cart/items/${initialItem.id}`, { quantity }));
            }
          }
        } else if (quantity > 0) {
          requests.push(apiClient.post(`/cart/items`, { businessId, productId, variantId: null, quantity }));
        }
      }

      if (requests.length > 0) {
        await Promise.all(requests);
        setAdded(true);
        queryClient.invalidateQueries({ queryKey: ["cart", businessId] });
        queryClient.invalidateQueries({ queryKey: ["carts", "all"] });
        setInitialized(false);
        setTimeout(() => setAdded(false), 3000);
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error("Failed to add to cart", err);
    } finally {
      setAddingToCart(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="aspect-square bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-1/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  if (!product) return null;
  const images = product.images || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white relative pb-36 md:pb-40">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-scroll">
        {/* Header / Hero Image */}
        <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 12H4M4 12L10 6M4 12L10 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            onClick={() => navigate(`/cart/${businessId}`)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm text-white"
          >
            <span className="text-xl">🛒</span>
          </button>

          {images.length > 0 ? (
            <img
              src={images[0]?.url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl text-gray-300">📦</span>
          )}
        </div>

        {/* Product details */}
        <div className="px-4 py-5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-2">
          <h1 className="text-[22px] font-semibold text-[#111B21] leading-tight mb-1.5">
            {product.name}
          </h1>
          <div className="h-7 flex items-center">
            <p className="text-[19px] font-medium text-[#111B21] animate-[fadeIn_0.3s_ease-out]">
              {isFrom ? (
                <span className="text-[#54656F] text-[15px] font-normal mr-1.5 tracking-wide">
                  From
                </span>
              ) : null}
              ₹{displayPrice.toLocaleString("en-IN")}
            </p>
          </div>
          {product.description && (
            <p className="text-[15px] mt-3.5 text-[#54656F] leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          )}
        </div>

        {/* Variants */}
        {(product.variantGroups || []).length > 0 && (
          <div className="px-4 py-5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-2">
            {product.variantGroups.map((group: any) => (
              <div key={group.id} className="mb-5 last:mb-0">
                <p className="text-[15px] font-medium text-[#54656F] mb-3">
                  {group.name}
                </p>
                <div className="flex flex-col border border-gray-100 rounded-lg overflow-hidden">
                  {group.values.map((val: any, idx: number) => {
                    const vQty = variantQuantities[val.id] || 0;
                    const vPrice = val.priceOverride
                      ? Number(val.priceOverride)
                      : Number(product.basePrice);
                    return (
                      <div
                        key={val.id}
                        className={`flex items-center justify-between p-3 bg-white ${idx < group.values.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <div className="flex-1">
                          <p className="text-[15px] font-medium text-[#111B21]">
                            {val.label}
                          </p>
                          <p className="text-[14px] text-green-700 font-medium">
                            ₹{vPrice.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-[#F0F2F5] rounded-full px-2 py-1">
                          <button
                            onClick={() =>
                              setVariantQuantities((p) => ({
                                ...p,
                                [val.id]: Math.max(0, (p[val.id] || 0) - 1),
                              }))
                            }
                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] pb-1 active:bg-gray-50"
                          >
                            −
                          </button>
                          <span className="text-[15px] font-medium min-w-[20px] text-center text-[#111B21]">
                            {vQty}
                          </span>
                          <button
                            onClick={() =>
                              setVariantQuantities((p) => ({
                                ...p,
                                [val.id]: (p[val.id] || 0) + 1,
                              }))
                            }
                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] pb-1 active:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="absolute flex flex-col bottom-0 left-0 right-0 bg-[#F0F2F5] pb-[calc(1rem+env(safe-area-inset-bottom))] z-20">
        {/* Added to cart toast */}
        {added && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#54656F] text-white px-5 py-2.5 rounded-full text-[14px] font-medium shadow-sm animate-fade-up">
            Added to cart
          </div>
        )}

        <div className="flex flex-col gap-2 px-4 py-3 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          {/* Global Quantity Stepper (Only show if no variants) */}
          {!hasVariants && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] text-[#54656F] font-medium">
                Quantity
              </span>
              <div className="flex items-center gap-4 bg-[#F0F2F5] rounded-full px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  disabled={quantity <= 0}
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl disabled:opacity-30 disabled:text-[#8696A0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] pb-1 active:bg-gray-50"
                >
                  −
                </button>
                <span className="text-[15px] font-medium min-w-[20px] text-center text-[#111B21]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock}
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl disabled:opacity-30 disabled:text-[#8696A0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] pb-1 active:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-1">
            <button
              className="flex-1 py-3 rounded-full text-[14px] font-medium text-[#128C7E] bg-white border border-[#128C7E] active:bg-[#F0F2F5] transition-colors"
              onClick={() => alert("WhatsApp messaging coming soon")}
            >
              Message Business
            </button>
            <button
              disabled={(totalItemsCount === 0 && initialCartItems.length === 0) || addingToCart}
              onClick={handleAddToCart}
              className={`flex-1 py-3 rounded-full text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-all ${
                totalItemsCount === 0 && initialCartItems.length === 0
                  ? "bg-[#F0F2F5] text-[#8696A0]"
                  : "bg-[#128C7E] active:bg-[#075E54] shadow-[0_2px_4px_rgba(18,140,126,0.3)]"
              }`}
            >
              {addingToCart ? (
                <div className="w-4 h-4 border-2 border-white/80 border-t-white rounded-full animate-spin" />
              ) : null}
              {initialCartItems.length > 0
                ? totalItemsCount === 0
                  ? "Remove from cart"
                  : `Update cart (${totalItemsCount})`
                : totalItemsCount === 0 ? "Select options" : `Add to cart (${totalItemsCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
