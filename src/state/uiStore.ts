import { create } from 'zustand'
import { simulatedNetwork, type ConnectionMode } from '@/sync/simulatedNetwork'

export interface AssessmentHeaderInfo {
  farmName: string
  siteReference: string
  standardLabel: string
  assessorType: string
  onBack: () => void
}

interface UiState {
  connectionMode: ConnectionMode
  onlyUnanswered: boolean
  openGuidance: Record<string, boolean>
  /** Set by the workspace/review screens so the shared TopBar can render
   * the farm-details pill in the header itself, rather than each screen
   * drawing its own separate sub-header row below the app bar. */
  assessmentHeader: AssessmentHeaderInfo | null
  setConnectionMode: (mode: ConnectionMode) => void
  toggleOnlyUnanswered: () => void
  toggleGuidance: (questionCode: string) => void
  setAssessmentHeader: (info: AssessmentHeaderInfo | null) => void
}

export const useUiStore = create<UiState>((set) => {
  simulatedNetwork.subscribe((mode) => set({ connectionMode: mode }))

  return {
    connectionMode: simulatedNetwork.getMode(),
    onlyUnanswered: false,
    openGuidance: {},
    assessmentHeader: null,

    setConnectionMode: (mode) => {
      simulatedNetwork.setMode(mode)
      set({ connectionMode: mode })
    },

    toggleOnlyUnanswered: () => set((s) => ({ onlyUnanswered: !s.onlyUnanswered })),

    toggleGuidance: (questionCode) =>
      set((s) => ({
        openGuidance: { ...s.openGuidance, [questionCode]: !s.openGuidance[questionCode] },
      })),

    setAssessmentHeader: (info) => set({ assessmentHeader: info }),
  }
})
