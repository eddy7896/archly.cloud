# ============================================================================
# Unified Dockerfile for archly.cloud Frontend (Next.js)
# Supports both development and production via NODE_ENV
# ============================================================================

FROM node:20-alpine

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install base tools + bun package manager
RUN apk add --no-cache curl && npm install -g turbo bun

# Copy package files
COPY package.json package-lock.json* bun.lockb* ./

# Install dependencies (production-only or all based on NODE_ENV)
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --only=production; \
    else \
      npm install; \
    fi

# Copy source code
COPY . .

# Generate Prisma client (needed for both dev and prod)
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma || true

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002 || exit 1

# Start server based on NODE_ENV
# Dev: builds and hot-reloads on startup
# Prod: expects pre-built .next from CI/separate build
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start --workspace=editor; \
    else \
      npm run dev; \
    fi
