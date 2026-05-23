FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_BACKEND_URL=http://localhost
ARG NEXT_PUBLIC_ML_SERVICE_URL=http://localhost
ARG NEXT_PUBLIC_WS_URL=ws://localhost/ws/analytics
ARG NEXT_PUBLIC_EMERGENCY_SOCKET_URL=http://localhost:4000
ARG BACKEND_INTERNAL_URL=http://backend:3001
ARG ML_SERVICE_URL=http://ml-service:8000

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_ML_SERVICE_URL=$NEXT_PUBLIC_ML_SERVICE_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_EMERGENCY_SOCKET_URL=$NEXT_PUBLIC_EMERGENCY_SOCKET_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
ENV ML_SERVICE_URL=$ML_SERVICE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Public files must be copied manually
COPY --from=builder /app/public ./public

# Leverage the standalone build directory output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Standalone builds run directly via node, bypassing npm start bloat
CMD ["node", "server.js"]