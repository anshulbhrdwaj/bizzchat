import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { 
  ChevronLeft, 
  ChevronRight, 
  Store, 
  Camera, 
  MapPin, 
  Phone, 
  Mail, 
  Check, 
  Loader2, 
  ShoppingBag, 
  Smartphone, 
  Utensils, 
  Activity, 
  Sparkles, 
  Home, 
  Dumbbell, 
  BookOpen, 
  Car, 
  Gem, 
  MoreHorizontal,
  PlusCircle,
  FileText
} from 'lucide-react'

const CATEGORIES = [
  { id: 'General Store', icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'Electronics', icon: <Smartphone className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'Fashion & Apparel', icon: <Sparkles className="w-4 h-4" />, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { id: 'Food & Restaurant', icon: <Utensils className="w-4 h-4" />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { id: 'Health & Pharmacy', icon: <Activity className="w-4 h-4" />, color: 'bg-red-50 text-red-600 border-red-100' },
  { id: 'Beauty & Salon', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'Home & Furniture', icon: <Home className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'Sports & Fitness', icon: <Dumbbell className="w-4 h-4" />, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  { id: 'Books & Stationery', icon: <BookOpen className="w-4 h-4" />, color: 'bg-stone-50 text-stone-600 border-stone-100' },
  { id: 'Auto & Parts', icon: <Car className="w-4 h-4" />, color: 'bg-slate-50 text-slate-600 border-slate-100' },
  { id: 'Jewelry', icon: <Gem className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  { id: 'Other', icon: <MoreHorizontal className="w-4 h-4" />, color: 'bg-gray-50 text-gray-600 border-gray-100' },
]

export default function BusinessSetupPage() {
  const navigate = useNavigate()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  
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
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isEditMode, setIsEditMode] = useState(false)

  // Check if business profile already exists
  const { data: profile } = useQuery({
    queryKey: ['biz-profile'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/business/profile')
        return data
      } catch {
        return null
      }
    },
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        category: profile.category || '',
        description: profile.description || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        logoUrl: profile.logoUrl || '',
        coverUrl: profile.coverUrl || '',
      })
      setLogoPreview(profile.logoUrl || null)
      setCoverPreview(profile.coverUrl || null)
      setIsEditMode(true)
    }
  }, [profile])

  const saveBusiness = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        await apiClient.put('/business/profile', form)
      } else {
        await apiClient.post('/business/profile', form)
      }
    },
    onSuccess: () => navigate('/dashboard'),
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (type === 'logo') {
        setLogoPreview(result)
        setForm(f => ({ ...f, logoUrl: result }))
      } else {
        setCoverPreview(result)
        setForm(f => ({ ...f, coverUrl: result }))
      }
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
    else saveBusiness.mutate()
  }

  const steps = ['Identity', 'Operations', 'Preview']

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-3 bg-wa-teal-dark border-b border-gray-100 flex items-center gap-3 shrink-0 relative z-20">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/settings')}
          className="w-9 h-9 flex items-center justify-center -ml-1 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-100" />
        </button>
        <div className="flex-1">
          <h1 className="text-[16px] font-bold text-gray-50 leading-none">
            {isEditMode ? 'Edit Business' : 'Setup Business'}
          </h1>
          <p className="text-[10px] font-medium text-gray-100 mt-0.5 uppercase tracking-wider">
            Step {step + 1} of {steps.length}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto w-full pb-24">
            {/* Progress Indicator */}
            <div className="px-5 py-5 flex gap-1.5">
              {steps.map((s, i) => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#128C7E]' : 'bg-gray-100'}`} />
              ))}
            </div>

            {/* Step 0: Identity */}
            {step === 0 && (
              <div className="px-5 animate-in fade-in slide-in-from-bottom-1 duration-400">
                <div className="flex flex-col items-center gap-6">
                  {/* Photo Section */}
                  <div className="relative mt-2">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm transition-all bg-gray-50`}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#128C7E] text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#0d6e63] active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
                  </div>

                  <div className="w-full space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Business Name</label>
                      <input 
                        type="text" 
                        value={form.name} 
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Acme Corporation"
                        className={`w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#128C7E] focus:bg-white rounded-xl outline-none transition-all text-[15px] font-semibold text-gray-900 ${errors.name ? 'border-red-200 bg-red-50 text-red-900' : ''}`} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Category</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {CATEGORIES.map(cat => (
                          <button 
                            key={cat.id} 
                            onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-[11px] font-semibold text-left ${
                              form.category === cat.id 
                                ? 'bg-[#128C7E]/5 border-[#128C7E] text-[#128C7E]' 
                                : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'
                            }`}
                          >
                            <div className={`${form.category === cat.id ? 'text-[#128C7E]' : 'text-gray-300'}`}>
                              {cat.icon}
                            </div>
                            <span className="truncate">{cat.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">About (Optional)</label>
                        <textarea 
                          value={form.description} 
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="What do you sell or offer?"
                          rows={2} 
                          className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#128C7E] focus:bg-white rounded-xl outline-none transition-all text-[14px] font-medium text-gray-900 resize-none leading-relaxed" 
                        />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Operations */}
            {step === 1 && (
              <div className="px-5 animate-in fade-in slide-in-from-bottom-1 duration-400">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-0.5 ml-0.5 text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <label className="text-[10px] font-bold uppercase tracking-wider">Business Location</label>
                    </div>
                    <textarea 
                      value={form.address} 
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Shop number, building, locality, city..."
                      rows={2} 
                      className={`w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#128C7E] focus:bg-white rounded-xl outline-none transition-all text-[14px] font-medium text-gray-900 resize-none leading-relaxed ${errors.address ? 'border-red-200 bg-red-50 text-red-900' : ''}`} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-0.5 ml-0.5 text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      <label className="text-[10px] font-bold uppercase tracking-wider">Contact Number</label>
                    </div>
                    <input 
                      type="tel" 
                      value={form.phone} 
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 99999 88888"
                      className={`w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#128C7E] focus:bg-white rounded-xl outline-none transition-all text-[15px] font-semibold text-gray-900 ${errors.phone ? 'border-red-200 bg-red-50 text-red-900' : ''}`} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-0.5 ml-0.5 text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                      <label className="text-[10px] font-bold uppercase tracking-wider">Email (Optional)</label>
                    </div>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="support@business.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#128C7E] focus:bg-white rounded-xl outline-none transition-all text-[15px] font-semibold text-gray-900" 
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 border border-gray-100">
                    <PlusCircle className="w-4 h-4 text-[#128C7E] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-bold text-gray-700 leading-tight">
                        Financial Settings
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        Tax and delivery fees can be added from the dashboard later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
              <div className="px-5 animate-in fade-in slide-in-from-bottom-1 duration-400">
                <div className="bg-gray-50 rounded-2xl p-5 flex flex-col border border-gray-100">
                   <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-4">Preview</p>
                   
                   <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100">
                      <div className="h-16 bg-[#128C7E]/5 flex items-center justify-center">
                         <Store className="w-6 h-6 text-[#128C7E]/10" />
                      </div>
                      
                      <div className="px-5 relative -mt-6 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white p-0.5 shadow-sm border border-gray-50 overflow-hidden flex items-center justify-center">
                           {logoPreview ? (
                             <img src={logoPreview} alt="" className="w-full h-full object-cover rounded-xl" />
                           ) : (
                             <Store className="w-6 h-6 text-gray-200" />
                           )}
                        </div>
                      </div>

                      <div className="px-5 pb-6">
                         <h3 className="text-[16px] font-bold text-gray-900 leading-tight mb-0.5">{form.name || 'Your Brand Name'}</h3>
                         <span className="text-[10px] font-bold text-[#128C7E] uppercase tracking-wider block mb-4">
                            {form.category || 'CATEGORY'}
                         </span>
                         
                         <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                            {form.description || 'Our commitment is to provide quality service to all our customers.'}
                         </p>

                         <div className="space-y-2 pt-4 border-t border-gray-50">
                            <div className="flex items-start gap-2">
                               <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                               <p className="text-[12px] text-gray-600">{form.address || 'Street Name, City, Country'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                               <p className="text-[12px] text-gray-600">{form.phone || '+91 00000 00000'}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl border border-gray-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ready to launch</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Bottom Bar */}
        <div className="sticky bottom-0 left-0 right-0 p-5 z-30 bg-white border-t border-gray-100">
           <div className="max-w-md mx-auto w-full">
              <button 
                onClick={handleNext} 
                disabled={saveBusiness.isPending}
                className={`w-full py-3.5 rounded-xl font-bold text-[15px] text-white transition-all active:scale-98 flex items-center justify-center gap-2 ${
                   saveBusiness.isPending ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#128C7E] hover:bg-[#0d6e63]'
                }`}
              >
                {saveBusiness.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{step < 2 ? 'Continue' : isEditMode ? 'Save Changes' : 'Go Live'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {step > 0 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="w-full mt-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Go Back
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
