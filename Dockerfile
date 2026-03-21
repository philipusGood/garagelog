# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ─── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# better-sqlite3 requires native bindings — install build tools then prune
RUN apk add --no-cache python3 make g++

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./

RUN npm ci --omit=dev 2>/dev/null || true

RUN mkdir -p /data /data/uploads

# Unraid Docker template labels
LABEL net.unraid.docker.managed="dockerman"
LABEL net.unraid.docker.webui="http://[IP]:[PORT:5002]/"

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=5002

EXPOSE 5002
VOLUME /data

CMD ["node", "dist/index.cjs"]
