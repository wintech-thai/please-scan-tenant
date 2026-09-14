# ---------- Build ----------
FROM node:22-alpine AS builder
ARG version
ARG NEXT_PUBLIC_WEB_ROLE="TENANT"
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.16.0 --activate

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --prefer-offline --frozen-lockfile

ENV NEXT_PUBLIC_APP_VERSION=$version
ENV NEXT_PUBLIC_WEB_ROLE=${NEXT_PUBLIC_WEB_ROLE}
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN pnpm build

# ---------- Run (standalone) ----------
FROM node:22-alpine AS runner
ARG version
ARG NEXT_PUBLIC_WEB_ROLE="TENANT"
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NEXT_PUBLIC_APP_VERSION=$version
ENV NEXT_PUBLIC_WEB_ROLE=${NEXT_PUBLIC_WEB_ROLE}
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
