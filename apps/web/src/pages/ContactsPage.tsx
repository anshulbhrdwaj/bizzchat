import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { usePresenceStore } from '@/stores/presenceStore'

export default function ContactsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const presence = usePresenceStore(s => s.presence)

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newPhone, setNewPhone] = useState('+')
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => { const { data } = await apiClient.get('/contacts'); return data },
  })

  const updateContact = useMutation({
    mutationFn: async ({ id, savedName }: { id: string; savedName: string }) => {
      await apiClient.put(`/contacts/${id}`, { savedName })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setEditingId(null) },
  })

  const deleteContact = useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/contacts/${id}`) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })

  const addContact = useMutation({
    mutationFn: async ({ phone, savedName }: { phone: string; savedName: string }) => {
      const { data } = await apiClient.post('/contacts', { phone, savedName }); return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setShowAdd(false); setNewPhone('+'); setNewName('') },
    onError: (err: any) => setAddError(err.response?.data?.error || 'Failed to add contact'),
  })

  const startChat = async (contactId: string) => {
    try {
      const { data: chat } = await apiClient.post('/chats', { recipientId: contactId })
      navigate(`/chats/${chat.id}`)
    } catch (err) { console.error('Failed to start chat', err) }
  }

  const filtered = contacts.filter((c: any) =>
    c.displayName?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* WhatsApp header */}
      <header className="shrink-0 safe-area-top bg-[#075E54] text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-[20px] font-medium">Contacts</h1>
          <button onClick={() => setShowAdd(true)} className="w-10 h-10 flex items-center justify-center rounded-full">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 8V14M17 11H23" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {/* Search bar */}
        <div className="px-3 pb-3">
          <input type="text" placeholder="Search name or number" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-[36px] px-4 rounded-lg bg-[#064E46] text-[14px] text-white placeholder:text-white/60 outline-none" />
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse border-b border-gray-100">
                <div className="w-[50px] h-[50px] rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1"><div className="h-4 w-32 rounded bg-gray-200 mb-2" /><div className="h-3 w-24 rounded bg-gray-100" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl text-gray-300 mb-3">👤</span>
            <p className="text-[15px] text-gray-500">{search ? 'No contacts found' : 'No contacts yet'}</p>
          </div>
        ) : (
          filtered.map((contact: any) => {
            const isOnline = presence[contact.contactId]?.isOnline ?? contact.isOnline
            const initials = contact.displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div key={contact.id} className="flex items-center gap-3 px-4 py-2.5 active:bg-gray-50 border-b border-gray-100">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center overflow-hidden bg-gray-200">
                    {contact.avatarUrl ? (
                      <img src={contact.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[17px] font-medium text-gray-500">{initials}</span>
                    )}
                  </div>
                  {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === contact.id ? (
                    <div className="flex gap-2">
                      <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 h-9 px-3 rounded bg-gray-100 text-[15px] text-gray-900 outline-none border border-gray-200 focus:border-[#128C7E]" />
                      <button onClick={() => updateContact.mutate({ id: contact.id, savedName: editName })}
                        className="px-4 h-9 rounded bg-[#128C7E] text-white text-[14px] font-medium">Save</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[17px] text-gray-900 truncate">{contact.displayName}</p>
                      <p className="text-[14px] text-gray-500 truncate">{contact.phone}</p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => {
                    if (editingId === contact.id) { setEditingId(null) }
                    else { setEditingId(contact.id); setEditName(contact.savedName || '') }
                  }} className="w-8 h-8 flex items-center justify-center text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => { if (confirm('Remove this contact?')) deleteContact.mutate(contact.id) }}
                    className="w-8 h-8 flex items-center justify-center text-red-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => startChat(contact.contactId)}
                    className="w-10 h-10 flex items-center justify-center text-[#128C7E]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91568 21 11V11.5Z" stroke="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) { setShowAdd(false); setAddError('') } }}>
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-6 animate-slide-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h2 className="text-[20px] font-medium text-gray-900 mb-1">New Contact</h2>
            <p className="text-[14px] text-gray-500 mb-6">Enter their phone number to add them.</p>

            <form onSubmit={e => { e.preventDefault(); addContact.mutate({ phone: newPhone, savedName: newName }) }}>
              <div className="space-y-3 mb-4">
                <input type="text" placeholder="Name (optional)" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full h-12 px-4 rounded bg-gray-100 text-[16px] text-gray-900 outline-none border border-gray-200 focus:border-[#128C7E]" />
                <input type="tel" placeholder="+1234567890" value={newPhone}
                  onChange={e => { setNewPhone(e.target.value); setAddError('') }}
                  className="w-full h-12 px-4 rounded bg-gray-100 text-[16px] font-medium text-gray-900 outline-none border border-gray-200 focus:border-[#128C7E]" />
              </div>
              {addError && <p className="text-[13px] text-red-500 mb-3">{addError}</p>}
              <button type="submit" disabled={addContact.isPending || newPhone.length < 5}
                className="w-full py-3.5 rounded-full bg-[#128C7E] text-white text-[16px] font-medium disabled:opacity-50">
                {addContact.isPending ? 'Adding...' : 'Add Contact'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
