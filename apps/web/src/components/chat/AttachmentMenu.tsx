import { useRef, useEffect } from 'react'

interface AttachmentMenuProps {
  onClose: () => void
  onImageSelect: (file: File) => void
  onDocumentSelect: (file: File) => void
}

export default function AttachmentMenu({ onClose, onImageSelect, onDocumentSelect }: AttachmentMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const ITEMS = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1" fill="white" />
        </svg>
      ),
      label: 'Camera',
      color: '#EC407A',
      action: () => cameraInputRef.current?.click(),
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="4" y1="22" x2="4" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      label: 'Gallery',
      color: '#9C27B0',
      action: () => imageInputRef.current?.click(),
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="18" x2="12" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="9" y1="15" x2="15" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      label: 'Document',
      color: '#1565C0',
      action: () => docInputRef.current?.click(),
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M22 16.92V19.92C22.0011 20.4813 21.7583 21.0175 21.3296 21.3926C20.9009 21.7678 20.3355 21.9513 19.7699 21.8998C16.5289 21.5564 13.4193 20.4289 10.7 18.6199C8.17 17.0003 6.01 14.8403 4.39 12.3099C2.57 9.58123 1.44267 6.45773 1.1 3.19986C1.04872 2.63584 1.23055 2.07176 1.60353 1.64309C1.97651 1.21441 2.50802 0.97025 3.07 0.969861H6.07C7.0664 0.959861 7.9139 1.67137 8.07 2.65986C8.22272 3.61971 8.48572 4.55927 8.85 5.45986C9.11 6.07986 8.94 6.78986 8.43 7.25986L7.09 8.59986C8.60524 11.2403 10.7597 13.3947 13.4 14.9099L14.74 13.5699C15.21 13.0599 15.92 12.8899 16.54 13.1499C17.4406 13.5142 18.3801 13.7772 19.34 13.9299C20.3399 14.0879 21.0598 14.9499 21.04 15.9599L22 16.92Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Contact',
      color: '#00796B',
      action: () => onClose(),
    },
  ]

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 flex gap-3 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-up"
    >
      {/* Hidden inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) { onImageSelect(file); onClose() }
          e.target.value = ''
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) { onImageSelect(file); onClose() }
          e.target.value = ''
        }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) { onDocumentSelect(file); onClose() }
          e.target.value = ''
        }}
      />

      {ITEMS.map(item => (
        <button
          key={item.label}
          onClick={item.action}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm active:opacity-80 transition-opacity"
            style={{ background: item.color }}
          >
            {item.icon}
          </div>
          <span className="text-[11px] font-medium text-gray-600">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
