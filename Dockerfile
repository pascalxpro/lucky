FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./prisma/dev.db"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Entrypoint for auto-init
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Ensure prisma dir is writable
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma
# Ensure uploads dir is writable
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
