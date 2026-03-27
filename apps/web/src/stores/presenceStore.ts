import { create } from 'zustand'

interface PresenceStore {
  presence: Record<string, { isOnline: boolean; lastSeen: string }>
  updatePresence: (userId: string, isOnline: boolean, lastSeen: string) => void
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  presence: {},
  updatePresence: (userId, isOnline, lastSeen) => set(state => ({
    presence: { ...state.presence, [userId]: { isOnline, lastSeen } },
  })),
}))
