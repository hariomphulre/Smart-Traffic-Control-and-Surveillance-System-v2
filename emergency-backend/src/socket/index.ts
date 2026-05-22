import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { SimulationEngine } from '../simulation/engine.js'
import { MAP_CENTER, POIS, INITIAL_INTERSECTIONS, INITIAL_ROADS } from '../data/city.js'
import type { VehicleType } from '../types.js'

export function attachSocketIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  })

  const engine = new SimulationEngine((state) => {
    io.emit('simulation:state', state)
  })

  io.on('connection', (socket) => {
    socket.emit('simulation:init', {
      center: MAP_CENTER,
      pois: POIS,
      intersections: INITIAL_INTERSECTIONS,
      roads: INITIAL_ROADS,
    })
    socket.emit('simulation:state', engine.getSnapshot())

    socket.on('simulation:start', (payload: { vehicleType?: VehicleType }) => {
      const type = payload?.vehicleType ?? 'ambulance'
      engine.start(type)
      io.emit('simulation:start', { vehicleType: type })
    })

    socket.on('simulation:stop', () => {
      engine.stop()
      io.emit('simulation:stop', {})
    })

    socket.on('simulation:reset', () => {
      engine.reset()
      io.emit('simulation:reset', {})
    })

    socket.on('simulation:resume', () => {
      engine.resume()
      io.emit('simulation:resume', {})
    })

    socket.on(
      'signal:configure',
      (payload: {
        intersectionId: string
        direction: 'north' | 'south' | 'east' | 'west'
        state?: 'red' | 'yellow' | 'green'
        countdown?: number
      }) => {
        if (payload?.intersectionId && payload?.direction) {
          engine.configureSignal(payload.intersectionId, payload.direction, {
            state: payload.state,
            countdown: payload.countdown,
          })
        }
      }
    )

    socket.on('emergency:override', (payload: { intersectionId: string; action: 'green' | 'red' | 'extend-green' | 'emergency' }) => {
      if (payload?.intersectionId && payload?.action) {
        engine.signalOverride(payload.intersectionId, payload.action)
        io.emit('emergency:override', payload)
      }
    })

    socket.on('traffic:update', (payload: { roadId?: string; intersectionId?: string; density: number }) => {
      if (payload.roadId) engine.setRoadDensity(payload.roadId, payload.density)
      if (payload.intersectionId) engine.setIntersectionDensity(payload.intersectionId, payload.density)
      io.emit('traffic:update', payload)
    })

    socket.on('road:block', (payload: { roadId: string; blocked: boolean }) => {
      engine.blockRoad(payload.roadId, payload.blocked)
    })
  })

  // Periodic granular events for clients that listen individually
  setInterval(() => {
    if (!engine.state.running) return
    const s = engine.getSnapshot()
    io.emit('signal:update', s.intersections)
    io.emit('traffic:update', s.roads)
    if (s.vehicles.length) {
      io.emit('emergency:move', s.vehicles)
      io.emit('route:update', s.vehicles)
    }
  }, 200)

  return { io, engine }
}
