export default function EmergencyRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="fixed inset-0 z-40 bg-[#0B1220]">{children}</div>
}
