import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shadow-sm border-b border-gray-100 shrink-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full active:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900 flex-1">Privacy Policy</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 prose prose-slate max-w-none">
        <p className="text-[14px] text-gray-500 mb-6 italic">Last updated: April 2, 2026</p>
        
        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          At BizChat, we respect your privacy. We collect your phone number for authentication and your name/avatar to identify you to other users in the chat and business transactions.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">2. How We Use Data</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          Your data is used solely to facilitate communication between you and businesses. We do not sell your personal data to third parties.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">3. Security</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          We use industry-standard security measures to protect your information. Your chat messages are stored securely and only accessible to the participants of the chat.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-6 mb-3">4. Your Rights</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4 text-justify">
          You can update your profile information at any time through the Settings page. You can also request data deletion by contacting our support.
        </p>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-[13px] text-gray-400">© 2026 BizChat · All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
