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

# Create a temporary .env.production to ensure Next.js finds the NEXT_PUBLIC variables during build
# This bypasses issues where Dokploy does not pass ARG variables to the build context
RUN echo "NEXT_PUBLIC_SUPABASE_URL=https://otpyrwkjpareekcftbhj.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cHlyd2tqcGFyZWVrY2Z0YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODg4ODYsImV4cCI6MjA4OTk2NDg4Nn0.AP527dUOZhQK0Soi8Zqggc754e8uPSD8EY6EQJpQMQk" > .env.production

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
