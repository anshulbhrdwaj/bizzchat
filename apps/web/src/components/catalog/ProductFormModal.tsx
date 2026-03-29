import { useState, useRef } from 'react'

interface ProductFormModalProps {
  onClose: () => void
  onSubmit: (data: { name: string; basePrice: number; description: string; image?: File }) => void
  isLoading?: boolean
}

export default function ProductFormModal({ onClose, onSubmit, isLoading }: ProductFormModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [desc, setDesc] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!name || !price) return
    onSubmit({
      name,
      basePrice: parseFloat(price),
      description: desc,
      image: image ?? undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 animate-slide-in-right">
      <header className="px-4 py-3 bg-[#075E54] text-white flex items-center justify-between safe-area-top shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-black/10 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-[17px] font-medium">Add new item</h1>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={!name || !price || isLoading}
          className="text-[15px] font-medium opacity-90 disabled:opacity-40"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Image Upload */}
        <div className="bg-white p-4 flex justify-center border-b border-gray-200">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-gray-50 text-[#128C7E]"
          >
            {image ? (
              <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                <span className="text-[11px] font-medium mt-1 text-gray-500">Add Image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => {
              if (e.target.files && e.target.files[0]) setImage(e.target.files[0])
            }} />
          </div>
        </div>

        <div className="bg-white border-y border-gray-200 mt-3 pt-2 pb-2">
          {/* Item Name */}
          <div className="px-4 py-2">
            <label className="text-[13px] font-medium text-gray-500 block">Item name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vintage Leather Bag"
              className="w-full py-2 text-[15px] text-gray-900 border-b-2 border-gray-300 focus:border-[#128C7E] outline-none transition-colors placeholder:text-gray-300" 
            />
          </div>

          {/* Price */}
          <div className="px-4 py-2 mt-2">
            <label className="text-[13px] font-medium text-gray-500 block">Price (₹)</label>
            <input 
              type="number" 
              min="0" step="0.01"
              value={price} 
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full py-2 text-[15px] text-gray-900 border-b-2 border-gray-300 focus:border-[#128C7E] outline-none transition-colors placeholder:text-gray-300" 
            />
          </div>

          {/* Description */}
          <div className="px-4 py-2 mt-2">
            <label className="text-[13px] font-medium text-gray-500 block">Description (Optional)</label>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              rows={3}
              placeholder="Product details, measurements, materials..."
              className="w-full py-2 text-[15px] text-gray-900 border-b-2 border-gray-300 focus:border-[#128C7E] outline-none transition-colors resize-none placeholder:text-gray-300" 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
