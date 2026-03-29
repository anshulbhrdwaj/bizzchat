import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api'

const CATEGORIES = [
  'Grocery & General Store', 'Electronics', 'Fashion & Apparel', 'Food & Restaurant',
  'Health & Pharmacy', 'Beauty & Salon', 'Home & Furniture', 'Sports & Fitness',
  'Books & Stationery', 'Auto & Parts', 'Jewelry', 'Other',
]

export default function BusinessSetupPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
    coverUrl: '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createBusiness = useMutation({
    mutationFn: async () => {
      await apiClient.post('/business/profile', form)
    },
    onSuccess: () => navigate('/dashboard'),
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(reader.result as string)
      setForm(f => ({ ...f, logoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (step === 0) {
      if (!form.name.trim()) errs.name = 'Required'
      if (!form.category) errs.category = 'Select a category'
    }
    if (step === 1) {
      if (!form.address.trim()) errs.address = 'Required'
      if (!form.phone.trim()) errs.phone = 'Required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    if (step < 2) setStep(step + 1)
    else createBusiness.mutate()
  }

  const steps = ['Business Info', 'Contact', 'Preview']

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* WhatsApp Header */}
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white shadow-sm">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/settings')}
          className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-black/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-[17px] font-medium flex-1">Business Profile</h1>
        <span className="text-[13px] font-medium opacity-80">Step {step + 1}/{steps.length}</span>
      </header>

      {/* Step Indicator */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`h-1 w-full rounded-full ${i <= step ? 'bg-[#128C7E]' : 'bg-gray-200'}`} />
            <span className={`text-[11px] font-medium ${i <= step ? 'text-[#128C7E]' : 'text-gray-400'}`}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Step 1: Business Info */}
        {step === 0 && (
          <div>
            {/* Logo upload */}
            <div className="bg-white p-6 flex flex-col items-center border-b border-gray-200">
              <button onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#128C7E]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span className="text-[11px] font-medium text-gray-500">Add Photo</span>
                  </div>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>

            {/* Business name */}
            <div className="bg-white mt-3 px-4 py-4 border-y border-gray-200">
              <label className="text-[13px] font-medium text-gray-500 block mb-1">Business name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sharma Electronics"
                className={`w-full py-2 text-[16px] text-gray-900 border-b-2 ${errors.name ? 'border-red-500' : 'border-gray-300 focus:border-[#128C7E]'} outline-none transition-colors`} />
              {errors.name && <p className="text-[12px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className="bg-white mt-3 px-4 py-4 border-y border-gray-200">
              <label className="text-[13px] font-medium text-gray-500 block mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                      form.category === cat
                        ? 'bg-[#128C7E] text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-[12px] text-red-500 mt-2">{errors.category}</p>}
            </div>

            {/* Description */}
            <div className="bg-white mt-3 px-4 py-4 border-y border-gray-200">
              <label className="text-[13px] font-medium text-gray-500 block mb-1">Description (optional)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell customers about your business..."
                rows={3} className="w-full py-2 text-[15px] text-gray-900 border-b-2 border-gray-300 focus:border-[#128C7E] outline-none transition-colors resize-none" />
            </div>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 1 && (
          <div>
            <div className="bg-white mt-3 px-4 py-4 border-y border-gray-200">
              <label className="text-[13px] font-medium text-gray-500 block mb-1">Business address</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Full business address..."
                rows={2} className={`w-full py-2 text-[15px] text-gray-900 border-b-2 ${errors.address ? 'border-red-500' : 'border-gray-300 focus:border-[#128C7E]'} outline-none transition-colors resize-none`} />
              {errors.address && <p className="text-[12px] text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div className="bg-white mt-3 px-4 py-4 border-y border-gray-200">
              <label className="text-[13px] font-medium text-gray-500 block mb-1">Phone number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className={`w-full py-2 text-[15px] text-gray-900 border-b-2 ${errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-[#128C7E]'} outline-none transition-colors`} />
              {errors.phone && <p className="text-[12px] text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div className="bg-white mt-3 px-4 py-4 border-y border-gray-200">
              <label className="text-[13px] font-medium text-gray-500 block mb-1">Email (optional)</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="business@example.com"
                className="w-full py-2 text-[15px] text-gray-900 border-b-2 border-gray-300 focus:border-[#128C7E] outline-none transition-colors" />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 2 && (
          <div className="mt-3">
            <div className="bg-white border-y border-gray-200 overflow-hidden">
              {/* Cover */}
              <div className="h-28 bg-[#128C7E] relative">
                <div className="absolute bottom-[-24px] left-4">
                  <div className="w-14 h-14 rounded-full border-3 border-white overflow-hidden flex items-center justify-center bg-white shadow">
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-xl font-bold text-gray-400">{form.name?.charAt(0) || 'B'}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-8 px-4 pb-4">
                <h3 className="text-[17px] font-medium text-gray-900">{form.name || 'Business Name'}</h3>
                <p className="text-[14px] text-[#128C7E] mb-3">{form.category || 'Category'}</p>
                {form.description && <p className="text-[14px] text-gray-600 mb-3">{form.description}</p>}

                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {form.address && <div className="flex items-start gap-2"><span className="text-sm">📍</span><p className="text-[14px] text-gray-700">{form.address}</p></div>}
                  {form.phone && <div className="flex items-center gap-2"><span className="text-sm">📞</span><p className="text-[14px] text-gray-700">{form.phone}</p></div>}
                  {form.email && <div className="flex items-center gap-2"><span className="text-sm">✉️</span><p className="text-[14px] text-gray-700">{form.email}</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3 pb-safe border-t border-gray-200 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={handleNext} disabled={createBusiness.isPending}
          className="w-full py-3.5 rounded-full font-medium text-[16px] text-white bg-[#128C7E] active:bg-[#075E54] transition-colors disabled:opacity-50">
          {createBusiness.isPending ? (
            <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</span>
          ) : step < 2 ? 'Continue' : 'Create Business Profile'}
        </button>
      </div>
    </div>
  )
}
