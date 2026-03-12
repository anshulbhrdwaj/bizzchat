import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  infoPanelOpen: boolean;
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  searchQuery: string;
  isMobile: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleInfoPanel: () => void;
  openModal: (name: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  setSearchQuery: (q: string) => void;
  setIsMobile: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      infoPanelOpen: false,
      activeModal: null,
      modalProps: {},
      searchQuery: '',
      isMobile: window.innerWidth < 640,

      setTheme: (theme) => {
        const root = document.documentElement;
        if (theme === 'light') root.setAttribute('data-theme', 'light');
        else if (theme === 'dark') root.removeAttribute('data-theme');
        else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) root.removeAttribute('data-theme');
          else root.setAttribute('data-theme', 'light');
        }
        set({ theme });
      },

      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      toggleInfoPanel: () => set(s => ({ infoPanelOpen: !s.infoPanelOpen })),
      openModal: (name, props = {}) => set({ activeModal: name, modalProps: props }),
      closeModal: () => set({ activeModal: null, modalProps: {} }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setIsMobile: (isMobile) => set({ isMobile }),
    }),
    {
      name: 'nexchat-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
