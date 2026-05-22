'use client'

import { useState, useCallback, useEffect } from 'react'
import { FiPlus, FiMinus, FiRotateCw, FiPlay, FiPause, FiMapPin } from 'react-icons/fi'
import type { GridNode, OptimizedRoute } from '@/lib/routeOptimization'
import { optimizeEmergencyRoute, getAlternativeRoutes } from '@/lib/routeOptimization'

interface EmergencySimulationMapProps {
  vehicleType: 'ambulance' | 'fire-brigade'
  onRouteSelect?: (route: OptimizedRoute) => void
}

const GRID_SIZE = 10 // 10x10 grid
const CELL_SIZE = 60 // pixels
const MAX_TRAFFIC_DENSITY = 100

interface GridCell extends GridNode {
  expanded?: boolean
}

export default function EmergencySimulationMap({
  vehicleType,
  onRouteSelect,
}: EmergencySimulationMapProps) {
  // Initialize grid
  const [grid, setGrid] = useState<GridCell[][]>(() => {
    const newGrid: GridCell[][] = []
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: GridCell[] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        row.push({
          x: i,
          y: j,
          trafficDensity: Math.random() * 60,
          signalStatus: 'green' as const,
          signalCountdown: 20,
          expanded: false,
        })
      }
      newGrid.push(row)
    }
    return newGrid
  })

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(
    vehicleType === 'ambulance' ? [GRID_SIZE - 1, GRID_SIZE - 1] : [GRID_SIZE - 1, GRID_SIZE - 1]
  )
  const [routes, setRoutes] = useState<OptimizedRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [vehiclePosition, setVehiclePosition] = useState<[number, number] | null>(null)

  // Handle cell click to set start/end points
  const handleCellClick = (x: number, y: number) => {
    if (!startPoint) {
      setStartPoint([x, y])
    } else if (!endPoint) {
      setEndPoint([x, y])
    } else {
      setStartPoint([x, y])
      setEndPoint(null)
    }
  }

  // Update cell properties
  const updateCell = (x: number, y: number, updates: Partial<GridCell>) => {
    const newGrid = grid.map((row) => [...row])
    newGrid[x][y] = { ...newGrid[x][y], ...updates }
    setGrid(newGrid)
  }

  // Calculate optimal route
  const calculateRoute = useCallback(() => {
    if (!startPoint || !endPoint) {
      alert('Please select both start and end points')
      return
    }

    const params = {
      startX: startPoint[0],
      startY: startPoint[1],
      endX: endPoint[0],
      endY: endPoint[1],
      grid: grid,
      vehicleType: vehicleType,
    }

    const optimalRoute = optimizeEmergencyRoute(params)
    const alternatives = getAlternativeRoutes(params, 2)

    setRoutes([optimalRoute, ...alternatives.slice(1)])
    setSelectedRoute(optimalRoute)
    onRouteSelect?.(optimalRoute)
  }, [startPoint, endPoint, grid, vehicleType, onRouteSelect])

  // Update signal countdowns
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      setGrid((prevGrid) =>
        prevGrid.map((row) =>
          row.map((cell) => {
            let newCountdown = cell.signalCountdown - 1

            if (newCountdown <= 0) {
              // Change signal status
              const signals = ['green', 'yellow', 'red'] as const
              const currentIndex = signals.indexOf(cell.signalStatus)
              const nextStatus = signals[(currentIndex + 1) % signals.length]

              // Set countdown based on new status
              if (nextStatus === 'green') newCountdown = 25
              else if (nextStatus === 'yellow') newCountdown = 5
              else newCountdown = 20

              return {
                ...cell,
                signalStatus: nextStatus,
                signalCountdown: newCountdown,
              }
            }

            return { ...cell, signalCountdown: newCountdown }
          })
        )
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isSimulating])

  // Simulate vehicle movement
  useEffect(() => {
    if (!isSimulating || !selectedRoute || selectedRoute.gridPath.length === 0) {
      return
    }

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < selectedRoute.gridPath.length) {
        const [x, y] = selectedRoute.gridPath[currentStep]
        setVehiclePosition([x, y])
        currentStep++
      } else {
        setIsSimulating(false)
        setVehiclePosition(null)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isSimulating, selectedRoute])

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg border border-gray-700">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Start Point
          </label>
          <div className="flex items-center gap-2">
            {startPoint ? (
              <span className="px-3 py-2 bg-green-500/20 text-green-400 rounded text-sm border border-green-500/30">
                Grid [{startPoint[0]}, {startPoint[1]}]
              </span>
            ) : (
              <span className="px-3 py-2 bg-gray-700 text-gray-400 rounded text-sm">
                Click on grid to set
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            End Point ({vehicleType === 'ambulance' ? 'Hospital' : 'Fire Station'})
          </label>
          <div className="flex items-center gap-2">
            {endPoint ? (
              <span className="px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm border border-red-500/30">
                Grid [{endPoint[0]}, {endPoint[1]}]
              </span>
            ) : (
              <span className="px-3 py-2 bg-gray-700 text-gray-400 rounded text-sm">
                Click on grid to set
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Map */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700 p-4">
        <div className="inline-block">
          <div
            className="relative"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
              backgroundColor: 'rgb(17, 24, 39)',
              border: '2px solid rgb(55, 65, 81)',
              borderRadius: '8px',
            }}
          >
            {/* Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            >
              {/* Vertical lines */}
              {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * CELL_SIZE}
                  y1={0}
                  x2={i * CELL_SIZE}
                  y2={GRID_SIZE * CELL_SIZE}
                  stroke="rgb(55, 65, 81)"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={i * CELL_SIZE}
                  x2={GRID_SIZE * CELL_SIZE}
                  y2={i * CELL_SIZE}
                  stroke="rgb(55, 65, 81)"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
            </svg>

            {/* Cells */}
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setSelectedCell([i, j])
                  }}
                  className="absolute group"
                  style={{
                    left: j * CELL_SIZE,
                    top: i * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                  title={`Traffic: ${Math.round(cell.trafficDensity)}% | Signal: ${cell.signalStatus} (${cell.signalCountdown}s)`}
                >
                  {/* Cell background based on traffic */}
                  <div
                    className="absolute inset-0 transition-all"
                    style={{
                      backgroundColor: `rgba(${
                        cell.trafficDensity > 60
                          ? '239, 68, 68'
                          : cell.trafficDensity > 30
                            ? '251, 146, 60'
                            : '34, 197, 94'
                      }, ${0.3 + (cell.trafficDensity / 100) * 0.5})`,
                    }}
                  />

                  {/* Signal light indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-3 h-3 rounded-full transition-all ${
                        cell.signalStatus === 'green'
                          ? 'bg-green-400 shadow-lg shadow-green-500/50'
                          : cell.signalStatus === 'yellow'
                            ? 'bg-yellow-400 shadow-lg shadow-yellow-500/50'
                            : 'bg-red-400 shadow-lg shadow-red-500/50'
                      }`}
                    />
                  </div>

                  {/* Start point marker */}
                  {startPoint?.[0] === i && startPoint?.[1] === j && (
                    <div className="absolute inset-0 border-2 border-green-400 bg-green-500/20" />
                  )}

                  {/* End point marker */}
                  {endPoint?.[0] === i && endPoint?.[1] === j && (
                    <div className="absolute inset-0 border-2 border-red-400 bg-red-500/20 flex items-center justify-center">
                      <FiMapPin className="text-red-400 w-4 h-4" />
                    </div>
                  )}

                  {/* Vehicle position */}
                  {vehiclePosition?.[0] === i && vehiclePosition?.[1] === j && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50 border-2 border-blue-300" />
                    </div>
                  )}

                  {/* Route path */}
                  {selectedRoute?.gridPath.some(
                    ([x, y]) => x === i && y === j
                  ) && (
                    <div className="absolute inset-0 bg-blue-400/20 border border-blue-400/50" />
                  )}

                  {/* Countdown display on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                    <div className="text-xs font-bold text-gray-200">
                      {cell.signalCountdown}s
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(cell.trafficDensity)}%
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cell Controls */}
      {selectedCell && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200">
            Cell [{selectedCell[0]}, {selectedCell[1]}] - Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Traffic Density: {Math.round(grid[selectedCell[0]][selectedCell[1]].trafficDensity)}%
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const cell = grid[selectedCell[0]][selectedCell[1]]
                    updateCell(selectedCell[0], selectedCell[1], {
                      trafficDensity: Math.max(0, cell.trafficDensity - 5),
                    })
                  }}
                  className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                >
                  <FiMinus className="w-4 h-4 mx-auto" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(
                    grid[selectedCell[0]][selectedCell[1]].trafficDensity
                  )}
                  onChange={(e) => {
                    updateCell(selectedCell[0], selectedCell[1], {
                      trafficDensity: parseFloat(e.target.value),
                    })
                  }}
                  className="flex-1"
                />
                <button
                  onClick={() => {
                    const cell = grid[selectedCell[0]][selectedCell[1]]
                    updateCell(selectedCell[0], selectedCell[1], {
                      trafficDensity: Math.min(100, cell.trafficDensity + 5),
                    })
                  }}
                  className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                >
                  <FiPlus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Signal Status
              </label>
              <select
                value={grid[selectedCell[0]][selectedCell[1]].signalStatus}
                onChange={(e) => {
                  updateCell(selectedCell[0], selectedCell[1], {
                    signalStatus: e.target.value as 'red' | 'yellow' | 'green',
                  })
                }}
                className="w-full p-2 bg-gray-700 text-gray-200 rounded border border-gray-600"
              >
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="red">Red</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Countdown: {grid[selectedCell[0]][selectedCell[1]].signalCountdown}s
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={grid[selectedCell[0]][selectedCell[1]].signalCountdown}
                onChange={(e) => {
                  updateCell(selectedCell[0], selectedCell[1], {
                    signalCountdown: parseFloat(e.target.value),
                  })
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={calculateRoute}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <FiRotateCw className="w-4 h-4" />
          Calculate Optimal Route
        </button>

        <button
          onClick={() => {
            if (selectedRoute) {
              setIsSimulating(!isSimulating)
            } else {
              alert('Please calculate a route first')
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          {isSimulating ? (
            <>
              <FiPause className="w-4 h-4" />
              Pause Simulation
            </>
          ) : (
            <>
              <FiPlay className="w-4 h-4" />
              Start Simulation
            </>
          )}
        </button>

        <button
          onClick={() => {
            setGrid(
              grid.map((row) =>
                row.map((cell) => ({
                  ...cell,
                  trafficDensity: Math.random() * 60,
                }))
              )
            )
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
        >
          Randomize Traffic
        </button>
      </div>

      {/* Route Information */}
      {selectedRoute && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-blue-300">Optimized Route</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Distance</div>
              <div className="text-blue-300 font-semibold">
                {Math.round(selectedRoute.totalDistance / 1000)}km
              </div>
            </div>
            <div>
              <div className="text-gray-400">Est. Time</div>
              <div className="text-blue-300 font-semibold">
                {Math.round(selectedRoute.estimatedTime / 60)}min{' '}
                {selectedRoute.estimatedTime % 60}s
              </div>
            </div>
            <div>
              <div className="text-gray-400">Viability</div>
              <div className="text-blue-300 font-semibold">
                {Math.round(selectedRoute.viabilityScore)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
