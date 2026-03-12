import { ArrowLeft, Construction } from 'lucide-react';

interface PlaceholderSettingsProps {
  title: string;
  onBack: () => void;
}

export default function PlaceholderSettings({ title, onBack }: PlaceholderSettingsProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div 
        className="px-4 pb-4 border-b flex items-center gap-4" 
        style={{ 
          borderColor: 'var(--glass-border)',
          paddingTop: 'calc(16px + env(safe-area-inset-top))' 
        }}
      >
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h2 className="text-lg font-bold font-display flex-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--bg-secondary)' }}>
          <Construction className="w-10 h-10" style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title} Settings</h3>
        <p className="max-w-[250px]" style={{ color: 'var(--text-secondary)' }}>
          This section is currently under construction. Please check back later!
        </p>
      </div>
    </div>
  );
}
