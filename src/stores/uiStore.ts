import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // State
  sidebarOpen: boolean;
  activeBuildingId: string | number | null;
  theme: "light" | "dark";
  language: "vi" | "en";

  // Actions
  toggleSidebar: () => void;
  setBuilding: (id: string | number | null) => void;
  toggleTheme: () => void;
  setLanguage: (lang: "vi" | "en") => void;
}

const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeBuildingId: null,
      theme: "light",
      language: "vi",

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setBuilding: (id) => {
        // Guard: reject NaN values that can sneak in from numeric conversions
        if (id !== null && !Number.isFinite(Number(id))) {
          set({ activeBuildingId: null });
        } else {
          set({ activeBuildingId: id });
        }
      },
      
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === "light" ? "dark" : "light" 
      })),
      
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'smartstay-ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useUIStore;
