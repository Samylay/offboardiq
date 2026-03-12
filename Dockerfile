FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build frontend
COPY src/frontend/package.json src/frontend/package-lock.json* ./src/frontend/
RUN cd src/frontend && npm ci
COPY src/frontend/ ./src/frontend/
RUN cd src/frontend && npm run build

# Copy backend source
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/

# Remove frontend source (only need built assets)
RUN rm -rf src/frontend/src src/frontend/node_modules

# Runtime
FROM node:18-alpine
WORKDIR /app

COPY --from=base /app ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "src/api/server.js"]
