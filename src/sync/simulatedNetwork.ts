export type ConnectionMode = 'offline' | 'cellular' | 'wifi'

type Listener = (mode: ConnectionMode) => void

/**
 * Dev/demo-only network simulator. A real web app can't reliably detect
 * wifi vs. cellular, so this is a deliberate, visually-distinct addition
 * beyond the design's single online/offline toggle — it's the concrete
 * lever needed to actually demonstrate "photos stay on this tablet until
 * you sync" rather than just asserting it happens invisibly.
 */
class SimulatedNetwork {
  private mode: ConnectionMode = 'wifi'
  private listeners = new Set<Listener>()

  getMode(): ConnectionMode {
    return this.mode
  }

  isOnline(): boolean {
    return this.mode !== 'offline'
  }

  /** Photos only drain on simulated wifi — cellular is "online enough" for
   * small answer-sync payloads but not for 8MB photos. */
  canSyncPhotos(): boolean {
    return this.mode === 'wifi'
  }

  setMode(mode: ConnectionMode): void {
    this.mode = mode
    for (const listener of this.listeners) listener(mode)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const simulatedNetwork = new SimulatedNetwork()

/** Jittered fake latency so the UI has something real to show mid-sync. */
export function simulatedLatency(): Promise<void> {
  const ms = 400 + Math.random() * 1100
  return new Promise((resolve) => setTimeout(resolve, ms))
}
