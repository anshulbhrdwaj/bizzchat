import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Briefcase, BarChart2, Package, Zap,
  Plus, Edit2, Trash2, ChevronRight, X, Check, Clock, Globe, Mail, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BusinessProfile, Product, QuickReply, Label } from '../types';

const BUSINESS_NAV = [
  { path: '/business', label: 'Profile', icon: Briefcase },
  { path: '/business/catalog', label: 'Catalog', icon: Package },
  { path: '/business/stats', label: 'Analytics', icon: BarChart2 },
  { path: '/business/tools', label: 'Tools', icon: Zap },
];

const CATEGORY_OPTIONS = [
  'Retail', 'Food & Beverage', 'Services', 'Technology', 'Healthcare',
  'Education', 'Fashion', 'Beauty', 'Finance', 'Real Estate', 'Other',
];

export default function BusinessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 pb-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--glass-border)', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
      >
        <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Business</h2>
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {BUSINESS_NAV.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/business' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'var(--bg-selected)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<BusinessProfileTab />} />
          <Route path="catalog" element={<CatalogTab />} />
          <Route path="stats" element={<StatsTab />} />
          <Route path="tools" element={<ToolsTab />} />
        </Routes>
      </div>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────
function BusinessProfileTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<BusinessProfile>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => {
      const { data } = await api.get('/business/profile');
      return data as BusinessProfile;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/business/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      setEditing(false);
      setError(null);
    },
    onError: (err: any) => setError(err.response?.data?.error || err.message || 'Failed to save profile'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/business/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      setEditing(false);
      setError(null);
    },
    onError: (err: any) => setError(err.response?.data?.error || err.message || 'Failed to create profile'),
  });

  const handleEdit = () => {
    setForm(profile || {});
    setEditing(true);
  };

  const handleSave = () => {
    if (profile) saveMutation.mutate(form);
    else createMutation.mutate(form);
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!profile && !editing) {
    return (
      <div className="p-4">
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Set up Business Profile</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Add your business details to get started</p>
          </div>
          <button
            onClick={() => { setForm({}); setEditing(true); }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {profile ? 'Edit Profile' : 'Create Profile'}
          </h3>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setError(null); }} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || createMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl text-sm border bg-red-500/10 text-red-500 border-red-500/20">
            {error}
          </div>
        )}

        {[
          { key: 'businessName', label: 'Business Name', placeholder: 'Your Business Name', icon: Briefcase },
          { key: 'email', label: 'Email', placeholder: 'contact@business.com', icon: Mail },
          { key: 'website', label: 'Website', placeholder: 'https://yourbusiness.com', icon: Globe },
          { key: 'address', label: 'Address', placeholder: 'Street, City, Country', icon: MapPin },
        ].map(({ key, label, placeholder, icon: Icon }) => (
          <div key={key}>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <input
                value={(form as any)[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
              />
            </div>
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <select
            value={form.category || ''}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
          >
            <option value="">Select category…</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
          <textarea
            value={form.description || ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Tell customers about your business…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Greeting Message</label>
          <textarea
            value={form.greetingMsg || ''}
            onChange={e => setForm(f => ({ ...f, greetingMsg: e.target.value }))}
            placeholder="Hello! Thanks for reaching out to {businessName}…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--accent-gradient)' }}>
              🏢
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{profile?.businessName}</h3>
              {profile?.category && <p className="text-xs mt-0.5" style={{ color: 'var(--accent-primary)' }}>{profile.category}</p>}
            </div>
          </div>
          <button onClick={handleEdit} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {profile?.description && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{profile.description}</p>
        )}

        <div className="space-y-2">
          {profile?.email && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {profile.email}
            </div>
          )}
          {profile?.website && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Globe className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {profile.website}
            </div>
          )}
          {profile?.address && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {profile.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Tab ───────────────────────────────────────────
function CatalogTab() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '', currency: 'INR' });

  const { data: profile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => { const { data } = await api.get('/business/profile'); return data as BusinessProfile; },
  });

  const products = profile?.products || [];

  const addMutation = useMutation({
    mutationFn: (d: any) => api.post('/business/products', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['business-profile'] }); setShowAddForm(false); setForm({ name: '', price: '', description: '', currency: 'INR' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/business/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {products.length} Products
        </p>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Product</p>
                <button onClick={() => setShowAddForm(false)} style={{ color: 'var(--text-tertiary)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {['name', 'description', 'price'].map(field => (
                <input
                  key={field}
                  value={(form as any)[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  type={field === 'price' ? 'number' : 'text'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                />
              ))}
              <button
                onClick={() => addMutation.mutate({ ...form, price: parseFloat(form.price) || undefined })}
                disabled={!form.name || addMutation.isPending}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'var(--accent-gradient)', opacity: (!form.name || addMutation.isPending) ? 0.6 : 1 }}
              >
                {addMutation.isPending ? 'Saving…' : 'Add Product'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Package className="w-12 h-12" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No products yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product: Product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden group relative"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center text-3xl" style={{ background: 'var(--bg-input)' }}>📦</div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                {product.price != null && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--accent-primary)' }}>
                    {product.currency} {product.price.toFixed(2)}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteMutation.mutate(product.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-black/50 text-white transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────
function StatsTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Messages Sent', value: '—', color: 'var(--accent-primary)' },
          { label: 'Delivered', value: '—', color: 'var(--accent-success)' },
          { label: 'Read', value: '—', color: 'var(--accent-secondary)' },
          { label: 'Active Chats', value: '—', color: 'var(--accent-warning)' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
          >
            <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-3"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
      >
        <BarChart2 className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Analytics charts coming soon
        </p>
        <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          Start messaging to see performance metrics here
        </p>
      </div>
    </div>
  );
}

// ─── Tools Tab ─────────────────────────────────────────────
function ToolsTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [qrShortcut, setQrShortcut] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#3E9BF7');

  const { data: profile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => { const { data } = await api.get('/business/profile'); return data as BusinessProfile; },
  });

  const addQR = useMutation({
    mutationFn: () => api.post('/business/quick-replies', { shortcut: `/${qrShortcut}`, message: qrMessage }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['business-profile'] }); setQrShortcut(''); setQrMessage(''); },
  });

  const deleteQR = useMutation({
    mutationFn: (id: string) => api.delete(`/business/quick-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
  });

  const addLabel = useMutation({
    mutationFn: () => api.post('/business/labels', { name: labelName, color: labelColor }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['business-profile'] }); setLabelName(''); },
  });

  const deleteLabel = useMutation({
    mutationFn: (id: string) => api.delete(`/business/labels/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
  });

  const TOOLS = [
    { id: 'quick-replies', label: 'Quick Replies', sublabel: `${profile?.quickReplies?.length || 0} saved` },
    { id: 'labels', label: 'Labels', sublabel: `${profile?.labels?.length || 0} labels` },
    { id: 'auto-messages', label: 'Auto Messages', sublabel: 'Greeting & Away' },
    { id: 'templates', label: 'Message Templates', sublabel: `${profile?.templates?.length || 0} templates` },
  ];

  return (
    <div className="p-4 space-y-2">
      {TOOLS.map(tool => (
        <div key={tool.id}>
          <button
            onClick={() => setActiveSection(activeSection === tool.id ? null : tool.id)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all hover:bg-[var(--bg-hover)] text-left"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tool.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{tool.sublabel}</p>
            </div>
            <motion.div animate={{ rotate: activeSection === tool.id ? 90 : 0 }}>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            </motion.div>
          </button>

          <AnimatePresence>
            {activeSection === tool.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 ml-2 rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--glass-border)' }}>
                  {tool.id === 'quick-replies' && (
                    <>
                      {profile?.quickReplies?.map((qr: QuickReply) => (
                        <div key={qr.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-medium" style={{ color: 'var(--accent-primary)' }}>/{qr.shortcut.replace('/', '')}</p>
                            <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{qr.message}</p>
                          </div>
                          <button onClick={() => deleteQR.mutate(qr.id)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--accent-danger)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input value={qrShortcut} onChange={e => setQrShortcut(e.target.value)} placeholder="shortcut" className="w-24 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                        <input value={qrMessage} onChange={e => setQrMessage(e.target.value)} placeholder="Reply message…" className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                        <button onClick={() => addQR.mutate()} disabled={!qrShortcut || !qrMessage} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: 'var(--accent-primary)', opacity: (!qrShortcut || !qrMessage) ? 0.5 : 1 }}>Add</button>
                      </div>
                    </>
                  )}

                  {tool.id === 'labels' && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {profile?.labels?.map((l: Label) => (
                          <div key={l.id} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ background: l.color + '33', border: `1px solid ${l.color}`, color: l.color }}>
                            {l.name}
                            <button onClick={() => deleteLabel.mutate(l.id)} className="ml-1">×</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={labelName} onChange={e => setLabelName(e.target.value)} placeholder="Label name" className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                        <input type="color" value={labelColor} onChange={e => setLabelColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none" />
                        <button onClick={() => addLabel.mutate()} disabled={!labelName} className="px-3 py-1.5 rounded-lg text-white text-xs" style={{ background: 'var(--accent-primary)', opacity: !labelName ? 0.5 : 1 }}>Add</button>
                      </div>
                    </>
                  )}

                  {tool.id === 'auto-messages' && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Configure greeting and away messages in the Profile tab.
                    </p>
                  )}

                  {tool.id === 'templates' && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {profile?.templates?.length
                        ? `${profile.templates.length} templates available`
                        : 'No templates yet. Create templates for common messages.'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
      ))}
    </div>
  );
}
