/** App modules that can be granted via IAM roles. */
export const IAM_SERVICES = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'logs', label: 'Logs' },
  { id: 'images', label: 'Images' },
  { id: 'challans', label: 'Challans' },
  { id: 'accidents', label: 'Accident Reports' },
  { id: 'ambulance', label: 'Ambulance' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'iam', label: 'IAM' },
  { id: 'audit-logs', label: 'Audit Logs' },
  { id: 'simulation', label: 'Simulation' },
] as const

export type IamServiceId = (typeof IAM_SERVICES)[number]['id']

export function serviceLabel(id: string) {
  return IAM_SERVICES.find((s) => s.id === id)?.label ?? id
}
