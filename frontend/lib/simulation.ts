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
  starting?: boolean
  batchStartedAt?: number
  signalSimulationRunning?: boolean
}

function enrichPartitionStatus(
  status: Record<string, SimulationPartitionStatus>,
  batchStartedAt?: number
): Record<PartitionId, SimulationPartitionStatus> {
  const enriched = {} as Record<PartitionId, SimulationPartitionStatus>
  for (const lane of [1, 2, 3, 4] as PartitionId[]) {
    const part = status[lane] || status[String(lane)] || { running: false }
    enriched[lane] = {
      ...part,
      startedAt: part.startedAt ?? batchStartedAt,
    }
  }
  return enriched
}

export async function runSimulation(payload: RunSimulationPayload): Promise<SimulationStatusResponse> {
  const res = await fetch('/api/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to start simulation')
  const data = (await res.json()) as SimulationStatusResponse
  return {
    ...data,
    status: enrichPartitionStatus(data.status || {}, data.batchStartedAt),
  }
}

export async function getSimulationStatus(): Promise<SimulationStatusResponse> {
  const res = await fetch('/api/simulation/status', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to get simulation status')
  const data = (await res.json()) as SimulationStatusResponse
  return {
    ...data,
    status: enrichPartitionStatus(data.status || {}, data.batchStartedAt),
  }
}

export async function stopSimulation(): Promise<void> {
  const res = await fetch('/api/simulation/stop', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to stop simulation')
}

export async function pauseSimulation(): Promise<SimulationStatusResponse> {
  const res = await fetch('/api/simulation/pause', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to pause simulation')
  const data = (await res.json()) as SimulationStatusResponse
  return {
    ...data,
    status: enrichPartitionStatus(data.status || {}, data.batchStartedAt),
  }
}

export async function resumeSimulation(): Promise<SimulationStatusResponse> {
  const res = await fetch('/api/simulation/resume', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to resume simulation')
  const data = (await res.json()) as SimulationStatusResponse
  return {
    ...data,
    status: enrichPartitionStatus(data.status || {}, data.batchStartedAt),
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
