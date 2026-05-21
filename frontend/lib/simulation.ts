export type PartitionId = 1 | 2 | 3 | 4

export interface RunSimulationPayload {
  partitions: Record<PartitionId, { video: string; model?: string; resolution?: string }>
}

export interface SimulationPartitionStatus {
  running: boolean
  video?: string
  model?: string
  resolution?: string
  streamUrl?: string
  startedAt?: number
}

export interface SimulationStatusResponse {
  status: Record<PartitionId, SimulationPartitionStatus>
  wsUrl: string
}

export async function runSimulation(payload: RunSimulationPayload): Promise<SimulationStatusResponse> {
  const res = await fetch('/api/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to start simulation')
  return (await res.json()) as SimulationStatusResponse
}

export async function getSimulationStatus(): Promise<SimulationStatusResponse> {
  const res = await fetch('/api/simulation/status')
  if (!res.ok) throw new Error('Failed to get simulation status')
  return (await res.json()) as SimulationStatusResponse
}

export async function stopSimulation(): Promise<void> {
  const res = await fetch('/api/simulation/stop', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to stop simulation')
}

