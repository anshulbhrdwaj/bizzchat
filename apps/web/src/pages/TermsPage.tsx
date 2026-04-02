import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shadow-sm border-b border-gray-100 shrink-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full active:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900 flex-1">Terms of Service</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 prose prose-slate max-w-none">
        <p className="text-[14px] text-gray-500 mb-6 italic">Last updated: April 2, 2026</p>
        
        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          By using BizChat, you agree to these legal terms. We provide a platform for consumers to interact with businesses through real-time communication.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">2. User Conduct</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          You agree to use the platform in a professional manner. Any form of harassment, spamming, or illegal activity will lead to an immediate ban.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">3. Payments & Orders</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          BizChat facilitates order placement and tracking. Any disputes related to payments or product quality should be resolved directly with the business.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">4. Limitation of Liability</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          We are not liable for any losses arising from transactions between you and the business. Our goal is to connect you, not to mediate.
        </p>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-[13px] text-gray-400">© 2026 BizChat · All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
