export interface SimulationVideo {
  id: string
  label: string
  file: string
}

/** Cache for available videos */
let videoCache: SimulationVideo[] | null = null
let videoCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/** Fetch available videos from the server */
export async function fetchAvailableVideos(): Promise<SimulationVideo[]> {
  const now = Date.now()

  // Return cached videos if still valid
  if (videoCache && now - videoCacheTime < CACHE_DURATION) {
    return videoCache
  }

  try {
    const response = await fetch('/api/videos')
    if (!response.ok) {
      console.error('Failed to fetch videos:', response.status)
      return []
    }

    const data = (await response.json()) as { videos?: SimulationVideo[] }
    videoCache = data.videos || []
    videoCacheTime = now
    return videoCache
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

/** Fallback videos if API fails */
const FALLBACK_VIDEOS: SimulationVideo[] = [
  { id: 'video2', label: 'video2.mp4', file: 'video2.mp4' },
  { id: 'video3', label: 'video3.mp4', file: 'video3.mp4' },
  { id: 'video11', label: 'video11.mp4', file: 'video11.mp4' },
  { id: 'video9', label: 'video9.mp4', file: 'video9.mp4' },
]

/** Get videos (cached or fallback) */
export async function getSimulationVideos(): Promise<SimulationVideo[]> {
  const videos = await fetchAvailableVideos()
  return videos.length > 0 ? videos : FALLBACK_VIDEOS
}

/** Get allowed files set */
export async function getAllowedFiles(): Promise<Set<string>> {
  const videos = await getSimulationVideos()
  return new Set(videos.map((v) => v.file))
}

export async function isAllowedVideoFile(file: string): Promise<boolean> {
  const allowedFiles = await getAllowedFiles()
  return allowedFiles.has(file)
}

/** Default: one unique video per lane (1–4). */
export async function getDefaultVideoByLane(): Promise<Record<1 | 2 | 3 | 4, string>> {
  const videos = await getSimulationVideos()

  // Assign videos to lanes, cycling through available videos
  const defaults: Record<1 | 2 | 3 | 4, string> = {
    1: videos[0]?.file || 'video2.mp4',
    2: videos[1]?.file || 'video3.mp4',
    3: videos[2]?.file || 'video11.mp4',
    4: videos[3]?.file || 'video9.mp4',
  }

  return defaults
}

export function getSimulationVideoUrl(file: string): string {
  return `/api/videos/${encodeURIComponent(file)}`
}
