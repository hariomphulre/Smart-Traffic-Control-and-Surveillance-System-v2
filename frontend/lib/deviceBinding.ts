/** Stable per-browser id used to group passkeys registered on this device. */
const STORAGE_KEY = 'signalx_device_binding_id'

export function getDeviceBindingId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return `ephemeral_${Date.now()}`
  }
}
