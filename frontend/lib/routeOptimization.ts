/**
 * Smart Emergency Vehicle Route Optimization Algorithm
 * Factors: Signal countdown, traffic density, signal status
 * Uses A* algorithm with multi-factor heuristic
 */

export interface GridNode {
  x: number
  y: number
  trafficDensity: number // 0-100
  signalStatus: 'red' | 'yellow' | 'green'
  signalCountdown: number // seconds
  visited?: boolean
  gCost?: number // actual cost from start
  hCost?: number // heuristic cost to goal
  parent?: GridNode
}

export interface RouteOptimizationParams {
  startX: number
  startY: number
  endX: number
  endY: number
  grid: GridNode[][]
  vehicleType: 'ambulance' | 'fire-brigade'
}

export interface OptimizedRoute {
  path: [number, number][]
  totalDistance: number
  estimatedTime: number // in seconds
  gridPath: [number, number][]
  viabilityScore: number // 0-100, higher is better
}

/**
 * Calculate movement cost based on traffic and signal state
 * Higher cost = worse route
 */
function calculateMovementCost(
  node: GridNode,
  isEmergency: boolean = true
): number {
  let cost = 1.0 // Base cost

  // Traffic density penalty (0-50 points)
  const trafficPenalty = (node.trafficDensity / 100) * 50
  cost += trafficPenalty

  // Signal status penalty (without emergency override)
  if (!isEmergency) {
    if (node.signalStatus === 'red') {
      cost += 30
    } else if (node.signalStatus === 'yellow') {
      cost += 15
    }
    // Green has no penalty
  } else {
    // Emergency vehicles get priority but still need to consider signal timing
    if (node.signalStatus === 'red') {
      cost += 10 // Lower penalty for emergency
    } else if (node.signalStatus === 'yellow') {
      cost += 5
    }
  }

  // Signal countdown: prefer nodes with longer green time ahead
  if (node.signalStatus === 'green') {
    // Reward longer green countdowns
    cost -= Math.min(node.signalCountdown / 30, 10) // Max 10 point reward
  } else if (node.signalStatus === 'red') {
    // Penalty for red signals with long countdowns
    cost += Math.min(node.signalCountdown / 30, 10)
  }

  return Math.max(1, cost) // Ensure cost is always positive
}

/**
 * Heuristic function for A* (Euclidean distance)
 */
function heuristic(current: GridNode, goal: GridNode): number {
  const dx = goal.x - current.x
  const dy = goal.y - current.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Get valid neighbors (4-directional movement)
 */
function getNeighbors(node: GridNode, grid: GridNode[][]): GridNode[] {
  const neighbors: GridNode[] = []
  const directions = [
    [0, 1], // right
    [1, 0], // down
    [0, -1], // left
    [-1, 0], // up
  ]

  for (const [dx, dy] of directions) {
    const newX = node.x + dx
    const newY = node.y + dy

    if (newX >= 0 && newX < grid.length && newY >= 0 && newY < grid[0].length) {
      neighbors.push(grid[newX][newY])
    }
  }

  return neighbors
}

/**
 * Main route optimization using A* algorithm
 */
export function optimizeEmergencyRoute(
  params: RouteOptimizationParams
): OptimizedRoute {
  const { startX, startY, endX, endY, grid, vehicleType } = params

  const startNode = grid[startX][startY]
  const goalNode = grid[endX][endY]

  // Initialize
  const openSet: GridNode[] = [startNode]
  const closedSet = new Set<GridNode>()
  const gCostMap = new Map<GridNode, number>()
  const parentMap = new Map<GridNode, GridNode>()

  startNode.gCost = 0
  startNode.hCost = heuristic(startNode, goalNode)

  while (openSet.length > 0) {
    // Find node with lowest fCost (gCost + hCost)
    let current = openSet[0]
    let currentIndex = 0
    let lowestFCost = (current.gCost || 0) + (current.hCost || 0)

    for (let i = 1; i < openSet.length; i++) {
      const node = openSet[i]
      const fCost = (node.gCost || 0) + (node.hCost || 0)
      if (fCost < lowestFCost) {
        current = node
        currentIndex = i
        lowestFCost = fCost
      }
    }

    if (current === goalNode) {
      // Reconstruct path
      const path: [number, number][] = []
      let node: GridNode | undefined = current
      while (node) {
        path.unshift([node.x, node.y])
        node = parentMap.get(node)
      }
      return buildRouteResult(path, grid, vehicleType)
    }

    openSet.splice(currentIndex, 1)
    closedSet.add(current)

    // Check neighbors
    const neighbors = getNeighbors(current, grid)
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue

      const isEmergency = vehicleType === 'ambulance' || vehicleType === 'fire-brigade'
      const tentativeGCost =
        (current.gCost || 0) + calculateMovementCost(neighbor, isEmergency)

      if (
        !openSet.includes(neighbor) ||
        tentativeGCost < (neighbor.gCost || Infinity)
      ) {
        parentMap.set(neighbor, current)
        neighbor.gCost = tentativeGCost
        neighbor.hCost = heuristic(neighbor, goalNode)

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor)
        }
      }
    }
  }

  // No path found, return direct path
  const directPath: [number, number][] = [[startX, startY], [endX, endY]]
  return buildRouteResult(directPath, grid, vehicleType)
}

/**
 * Build the final route result with metrics
 */
function buildRouteResult(
  path: [number, number][],
  grid: GridNode[][],
  vehicleType: string
): OptimizedRoute {
  let totalDistance = 0
  let totalTime = 0
  let redSignalEncounters = 0
  let greenSignalBenefit = 0

  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i]
    const [x2, y2] = path[i + 1]

    // Distance (simplified: 1 unit per grid cell, ~100m per cell)
    totalDistance += 100

    // Time calculation based on node properties
    const node = grid[x2][y2]
    const baseTravelTime = 30 // 30 seconds per cell

    // Adjust time based on traffic
    const trafficFactor = 1 + node.trafficDensity / 100
    let travelTime = baseTravelTime * trafficFactor

    // Signal impact
    if (node.signalStatus === 'red') {
      redSignalEncounters++
      travelTime += node.signalCountdown
    } else if (node.signalStatus === 'green') {
      greenSignalBenefit += Math.min(node.signalCountdown, 20)
      travelTime -= 5 // Bonus for green light
    }

    totalTime += travelTime
  }

  // Calculate viability score (0-100)
  let viabilityScore = 100
  viabilityScore -= redSignalEncounters * 15 // Penalty for red signals
  viabilityScore += greenSignalBenefit / 2 // Bonus for green signals
  viabilityScore = Math.max(0, Math.min(100, viabilityScore))

  return {
    path: path.map(([x, y]) => [
      grid[x][y].x * 100, // Convert to lat/lng-like coordinates
      grid[x][y].y * 100,
    ]),
    gridPath: path,
    totalDistance,
    estimatedTime: Math.max(60, totalTime), // Minimum 1 minute
    viabilityScore,
  }
}

/**
 * Get alternative routes using penalty method
 */
export function getAlternativeRoutes(
  params: RouteOptimizationParams,
  count: number = 2
): OptimizedRoute[] {
  const routes: OptimizedRoute[] = []
  routes.push(optimizeEmergencyRoute(params))

  // Generate alternatives by temporarily penalizing the first route
  for (let i = 0; i < count - 1; i++) {
    const modifiedGrid = params.grid.map((row) =>
      row.map((node) => ({
        ...node,
        trafficDensity: node.trafficDensity + Math.random() * 20, // Add randomness
      }))
    )

    routes.push(
      optimizeEmergencyRoute({
        ...params,
        grid: modifiedGrid,
      })
    )
  }

  return routes.sort((a, b) => b.viabilityScore - a.viabilityScore)
}

/**
 * Recalculate route based on updated traffic conditions
 */
export function recalculateRoute(
  currentPath: [number, number][],
  currentPosition: [number, number],
  params: RouteOptimizationParams
): OptimizedRoute | null {
  // Find closest point on current path to current position
  let closestIndex = 0
  let minDistance = Infinity

  for (let i = 0; i < currentPath.length; i++) {
    const [x, y] = currentPath[i]
    const dx = x - currentPosition[0]
    const dy = y - currentPosition[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      minDistance = distance
      closestIndex = i
    }
  }

  // If past 90% of route, recalculate from current position
  if (closestIndex > currentPath.length * 0.9) {
    const [currentX, currentY] = currentPosition
    return optimizeEmergencyRoute({
      ...params,
      startX: Math.round(currentX / 100),
      startY: Math.round(currentY / 100),
    })
  }

  return null // Keep current route
}
