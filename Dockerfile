# Stage 1: Dependencies and System Libraries
FROM oven/bun:latest AS base
WORKDIR /app

# Force IPv4 for apt-get to avoid connection issues on some VPS
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4

# Update package lists
RUN apt-get update || (sleep 5 && apt-get update)

# Install basic certificates and utilities
RUN apt-get install -y --no-install-recommends ca-certificates curl

# Install system libraries required by Puppeteer/Chromium
RUN apt-get install -y --no-install-recommends \
    libnss3 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 \
    libxrandr2 libgbm1 libasound2 libxss1

# Install fonts separately (often a source of errors)
RUN apt-get install -y --no-install-recommends \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-freefont-ttf

# Install Chromium as the final step (main suspect)
RUN apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Build
FROM base AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

COPY . .
# Ensure we have the standalone output configuration
# Next.js 15 requires specific environment variables during build if they affect the client
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Limit Node memory to prevent OOM freezes during build on VPS
ENV NODE_OPTIONS="--max-old-space-size=2048"

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
# Force rebuild cache bust: Wed Mar 25 14:02:10 CET 2026
