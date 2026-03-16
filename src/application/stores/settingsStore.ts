import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  businessName: string
  lowStockThreshold: number
  expirationAlertDays: number
}

interface SettingsState extends Settings {
  update: (settings: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      businessName: 'Meu Negócio',
      lowStockThreshold: 5,
      expirationAlertDays: 7,
      update: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'stock-app-settings',
    },
  ),
)
