import { create } from 'zustand'
import { simulatedNetwork, type ConnectionMode } from '@/sync/simulatedNetwork'

interface UiState {
  connectionMode: ConnectionMode
  /** Keyed by question code — the answer dock's guidance disclosure state
   * (see `AnswerDock.tsx`). */
  openGuidance: Record<string, boolean>
  setConnectionMode: (mode: ConnectionMode) => void
  toggleGuidance: (questionCode: string) => void
}

export const useUiStore = create<UiState>((set) => {
  simulatedNetwork.subscribe((mode) => set({ connectionMode: mode }))

  return {
    connectionMode: simulatedNetwork.getMode(),
    openGuidance: {},

    setConnectionMode: (mode) => {
      simulatedNetwork.setMode(mode)
      set({ connectionMode: mode })
    },

    toggleGuidance: (questionCode) =>
      set((s) => ({
        openGuidance: { ...s.openGuidance, [questionCode]: !s.openGuidance[questionCode] },
      })),
  }
})
