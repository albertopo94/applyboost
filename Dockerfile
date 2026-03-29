# Stage 1: Dependencies
FROM oven/bun:latest AS base
WORKDIR /app

# Force IPv4 for apt-get
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl libnss3 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libxss1 fonts-ipafont-gothic fonts-wqy-zenhei fonts-freefont-ttf chromium && rm -rf /var/lib/apt/lists/*

# Stage 2: Build
FROM base AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# INYECCION DE VARIABLES CRITICAS PARA EL CLIENTE (NEXT_PUBLIC)
# Se crean en un .env físico para que el build de Next.js las muerda SI O SI.
RUN echo "NEXT_PUBLIC_SUPABASE_URL=https://otpyrwkjpareekcftbhj.supabase.co" > .env
RUN echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cHlyd2tqcGFyZWVrY2Z0YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODg4ODYsImV4cCI6MjA4OTk2NDg4Nn0.AP527dUOZhQK0Soi8Zqggc754e8uPSD8EY6EQJpQMQk" >> .env
RUN echo "NEXT_TELEMETRY_DISABLED=1" >> .env
RUN echo "NEXT_IGNORE_TYPE_CHECKING=1" >> .env
RUN echo "NEXT_IGNORE_ESLINT=1" >> .env

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copiamos lo necesario del builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Re-instalamos solo las dependencias necesarias de runtime (incluyendo canvas)
# Esto asegura que el binario de @napi-rs/canvas esté disponible en el runner
RUN bun install --production @napi-rs/canvas

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "server.js"]
