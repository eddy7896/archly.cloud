# ============================================================================
# Unified Dockerfile for archly.cloud Frontend (Next.js)
# Supports both development and production via NODE_ENV
# ============================================================================

FROM node:20-alpine

WORKDIR /app

# Install base tools
RUN npm install -g turbo && apk add --no-cache curl

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

# Build in non-production
RUN if [ "$NODE_ENV" != "production" ]; then \
      npm run build; \
    fi

# Generate Prisma client for production
RUN if [ "$NODE_ENV" = "production" ]; then \
      npx prisma generate --schema=./packages/database/prisma/schema.prisma || true; \
    fi

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002 || exit 1

# Start server based on NODE_ENV
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start --workspace=editor; \
    else \
      npm run dev; \
    fi
