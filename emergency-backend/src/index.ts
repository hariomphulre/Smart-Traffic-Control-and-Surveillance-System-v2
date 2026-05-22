import http from 'http'
import express from 'express'
import cors from 'cors'
import { attachSocketIO } from './socket/index.js'
import { POIS, INITIAL_INTERSECTIONS, INITIAL_ROADS, MAP_CENTER } from './data/city.js'

const PORT = Number(process.env.PORT || 4000)

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'emergency-route-backend' })
})

app.get('/api/city', (_req, res) => {
  res.json({
    center: MAP_CENTER,
    pois: POIS,
    intersections: INITIAL_INTERSECTIONS,
    roads: INITIAL_ROADS,
  })
})

const server = http.createServer(app)
attachSocketIO(server)

server.listen(PORT, () => {
  console.log(`Emergency route backend listening on http://localhost:${PORT}`)
  console.log(`Socket.IO path: /socket.io`)
})
