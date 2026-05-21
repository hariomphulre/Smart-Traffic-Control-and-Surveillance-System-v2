declare module 'hls.js' {
  export interface HlsErrorData {
    fatal: boolean
    type: string
  }

  export default class Hls {
    static isSupported(): boolean
    static Events: {
      MANIFEST_PARSED: string
      ERROR: string
    }
    static ErrorTypes: {
      NETWORK_ERROR: string
      MEDIA_ERROR: string
    }
    constructor(config?: Record<string, unknown>)
    loadSource(url: string): void
    attachMedia(media: HTMLVideoElement): void
    destroy(): void
    startLoad(): void
    recoverMediaError(): void
    on(event: string, callback: (event: string, data: HlsErrorData) => void): void
  }
}
