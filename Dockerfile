# ============================================================================
# Multi-stage Dockerfile for archly.cloud Frontend (Next.js)
# ============================================================================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* bun.lockb* ./
RUN npm install -g turbo && npm ci

# Copy source code
COPY . .

# Build all packages and apps
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS production

WORKDIR /app

# Install minimal dependencies
ENV NODE_ENV=production

COPY package.json package-lock.json* bun.lockb* ./
RUN npm install -g turbo && npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/.next ./apps/editor/.next
COPY --from=builder /app/apps/editor/public ./apps/editor/public

# Copy source for runtime (Prisma, etc.)
COPY apps/editor ./apps/editor
COPY packages ./packages

# Generate Prisma client
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma || true

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm exec -- curl -f http://localhost:3002/api/health || exit 1

# Start Next.js server
CMD ["npm", "start", "--workspace=editor"]
