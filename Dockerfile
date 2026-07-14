# Container image for Fly.io / any container host.
# Node 22 is required — the app uses the built-in node:sqlite module.

# ---- build stage ----
FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Strip dev dependencies so the runtime image only carries what next start needs.
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the built app + pruned (production-only) node_modules from the builder.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./
# Placeholder martyr seed data (read on first boot). The live DB lives on the
# mounted volume via DATABASE_PATH, not here.
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
