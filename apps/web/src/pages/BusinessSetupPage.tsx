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
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/settings')}
          className="w-9 h-9 rounded-xl flex items-center justify-center touch-target"
          style={{ color: 'var(--color-text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Business Setup</h1>
      </header>

      {/* Stepper */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: i <= step ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: i <= step ? 'white' : 'var(--color-text-muted)',
                }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-[10px] font-medium hidden sm:block" style={{ color: i <= step ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-0.5 rounded" style={{ background: i < step ? 'var(--color-primary)' : 'var(--glass-border)' }} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Step 1: Business Info */}
        {step === 0 && (
          <div className="animate-fade-up space-y-4">
            {/* Logo upload */}
            <div className="flex flex-col items-center mb-4">
              <button onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed transition-all"
                style={{ borderColor: 'var(--color-primary)', background: logoPreview ? 'transparent' : 'var(--color-primary-light)' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">📷</span>
                    <span className="text-[9px] font-semibold" style={{ color: 'var(--color-primary)' }}>Add Logo</span>
                  </div>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>

            {/* Business name */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>Business Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sharma Electronics"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--color-surface)', border: `1.5px solid ${errors.name ? 'var(--color-error)' : 'var(--glass-border)'}`,
                  color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)',
                }} />
              {errors.name && <p className="text-[10px] mt-1" style={{ color: 'var(--color-error)' }}>{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>Category *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: form.category === cat ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: form.category === cat ? 'white' : 'var(--color-text-body)',
                      border: `1.5px solid ${form.category === cat ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-[10px] mt-1" style={{ color: 'var(--color-error)' }}>{errors.category}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell customers about your business..."
                rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--glass-border)', color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
            </div>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 1 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>Business Address *</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Full business address..."
                rows={2} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--color-surface)', border: `1.5px solid ${errors.address ? 'var(--color-error)' : 'var(--glass-border)'}`, color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
              {errors.address && <p className="text-[10px] mt-1" style={{ color: 'var(--color-error)' }}>{errors.address}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>Business Phone *</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface)', border: `1.5px solid ${errors.phone ? 'var(--color-error)' : 'var(--glass-border)'}`, color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
              {errors.phone && <p className="text-[10px] mt-1" style={{ color: 'var(--color-error)' }}>{errors.phone}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="business@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--glass-border)', color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 2 && (
          <div className="animate-fade-up">
            {/* Preview card */}
            <div className="glass-card overflow-hidden">
              {/* Cover */}
              <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
                <div className="absolute bottom-[-24px] left-4">
                  <div className="w-14 h-14 rounded-2xl border-3 overflow-hidden flex items-center justify-center"
                    style={{ borderColor: 'var(--color-background)', background: logoPreview ? 'white' : 'rgba(255,255,255,0.2)' }}>
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-xl font-bold text-white">{form.name?.charAt(0) || 'B'}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-8 px-4 pb-4">
                <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{form.name || 'Business Name'}</h3>
                <p className="text-xs mb-2" style={{ color: 'var(--color-primary)' }}>{form.category || 'Category'}</p>
                {form.description && <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{form.description}</p>}

                <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  {form.address && <div className="flex items-start gap-2"><span className="text-xs">📍</span><p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{form.address}</p></div>}
                  {form.phone && <div className="flex items-center gap-2"><span className="text-xs">📞</span><p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{form.phone}</p></div>}
                  {form.email && <div className="flex items-center gap-2"><span className="text-xs">✉️</span><p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{form.email}</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-3 safe-area-bottom" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--glass-border)' }}>
        <button onClick={handleNext} disabled={createBusiness.isPending}
          className="w-full h-14 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))', boxShadow: '0 4px 20px rgba(91, 63, 217, 0.3)' }}>
          {createBusiness.isPending ? (
            <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</span>
          ) : step < 2 ? 'Continue' : 'Create Business Profile'}
        </button>
      </div>
    </div>
  )
}
