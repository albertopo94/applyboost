# Stage 1: Dependencies and System Libraries
FROM oven/bun:1.1-slim AS base
WORKDIR /app

# Install dependencies for Chromium and Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    libnss3 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Build
FROM base AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Ensure we have the standalone output configuration
# Next.js 15 requires specific environment variables during build if they affect the client
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN bun run build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Puppeteer usually needs a sandbox disabled or specific flags in Docker, 
# but installing system dependencies first is the key.

# Automatically leverage standalone output optimization
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

# Use bun to run the standalone server (compatible with Next.js 15 server.js)
CMD ["bun", "server.js"]
