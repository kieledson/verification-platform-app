import { create } from 'zustand'
import { simulatedNetwork, type ConnectionMode } from '@/sync/simulatedNetwork'

interface UiState {
  connectionMode: ConnectionMode
  onlyUnanswered: boolean
  openGuidance: Record<string, boolean>
  setConnectionMode: (mode: ConnectionMode) => void
  toggleOnlyUnanswered: () => void
  toggleGuidance: (questionCode: string) => void
}

export const useUiStore = create<UiState>((set) => {
  simulatedNetwork.subscribe((mode) => set({ connectionMode: mode }))

  return {
    connectionMode: simulatedNetwork.getMode(),
    onlyUnanswered: false,
    openGuidance: {},

    setConnectionMode: (mode) => {
      simulatedNetwork.setMode(mode)
      set({ connectionMode: mode })
    },

    toggleOnlyUnanswered: () => set((s) => ({ onlyUnanswered: !s.onlyUnanswered })),

    toggleGuidance: (questionCode) =>
      set((s) => ({
        openGuidance: { ...s.openGuidance, [questionCode]: !s.openGuidance[questionCode] },
      })),
  }
})
