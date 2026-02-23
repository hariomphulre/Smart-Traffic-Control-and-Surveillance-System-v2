'use client'

import dynamic from 'next/dynamic'

const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  { ssr: false }
)

export default function TrafficHeatMap() {
  return (
    <div className="w-full h-[500px]">
      <LeafletMap />
    </div>
  )
}
