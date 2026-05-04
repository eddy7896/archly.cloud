# ============================================================================
# Unified Dockerfile for Yjs Collaboration Server
# Supports both development and production via NODE_ENV
# ============================================================================

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=${NODE_ENV:-production}

# Install base tools
RUN apk add --no-cache curl
RUN if [ "$NODE_ENV" = "development" ]; then \
      npm install -g nodemon; \
    fi

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (production-only or all based on NODE_ENV)
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm install --only=production; \
    else \
      npm install; \
    fi

# Copy source code
COPY . .

# Build in development
RUN if [ "$NODE_ENV" = "development" ]; then \
      npm run build; \
    fi

EXPOSE 1234

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:1234/health || exit 1

# Start server based on NODE_ENV
CMD if [ "$NODE_ENV" = "production" ]; then \
      node dist/index.js; \
    else \
      npm run dev; \
    fi
