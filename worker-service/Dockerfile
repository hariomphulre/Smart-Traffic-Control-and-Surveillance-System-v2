FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY worker.js ./
# Workers do not expose ports since they pull tasks out of queues asynchronously
CMD ["npm", "start"]