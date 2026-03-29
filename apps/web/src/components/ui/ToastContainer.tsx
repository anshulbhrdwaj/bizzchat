import { useEffect, useState } from 'react'
import { useToastStore, Toast } from '@/stores/toastStore'

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-500">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  undo: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-500">
      <path d="M3 7v6h6M3 13.5A9 9 0 1 0 12 3v0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const BORDERS = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
  warning: 'border-l-amber-500',
  undo: 'border-l-gray-700'
}

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts)
  const removeToast = useToastStore(state => state.removeToast)
  
  return (
    <div className="fixed z-[100] flex flex-col gap-2 p-4 bottom-0 left-0 right-0 md:left-auto md:w-96 pointer-events-none pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: () => void }) {
  const [progress, setProgress] = useState(100)
  const isUndo = toast.type === 'undo'
  
  useEffect(() => {
    if (!toast.duration) return
    const interval = 50
    const steps = toast.duration / interval
    let currentStep = 0
    
    const timer = setInterval(() => {
      currentStep++
      setProgress(Math.max(0, 100 - (currentStep / steps) * 100))
      if (currentStep >= steps) clearInterval(timer)
    }, interval)
    
    return () => clearInterval(timer)
  }, [toast.duration])

  return (
    <div className={`pointer-events-auto flex flex-col overflow-hidden bg-white rounded-lg shadow-lg border border-gray-100 border-l-[4px] ${BORDERS[toast.type]} animate-[slideUp_0.3s_ease-out]`}>
      <div className="flex items-center gap-3 p-3">
        <div className="shrink-0">
          {ICONS[toast.type]}
        </div>
        <p className="flex-1 text-[14px] font-medium text-gray-800 break-words">
          {toast.message}
        </p>
        
        {isUndo && toast.onUndo && (
          <button 
            onClick={() => { toast.onUndo!(); onClose(); }}
            className="shrink-0 px-3 py-1 rounded-md text-[13px] font-semibold text-[#128C7E] bg-[#128C7E]/10 hover:bg-[#128C7E]/20 transition-colors"
          >
            UNDO
          </button>
        )}
        
        {!isUndo && (
          <button onClick={onClose} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      
      {/* Progress bar for undo toasts */}
      {isUndo && (
        <div className="h-1 bg-gray-100 w-full">
          <div 
            className="h-full bg-gray-700 transition-all duration-[50ms] ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
