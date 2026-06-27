FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --shamefully-hoist --frozen-lockfile

FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public config (NEXT_PUBLIC_* are inlined at build).
# NEXT_PUBLIC_API_URL / WEBSOCKET_URL are intentionally EMPTY: the single multi-tenant
# image derives the erp-api host at runtime from the UI host (erp.<domain> → erpapi.<domain>),
# falling back to the platform backend. Baking a tenant-specific value here would defeat that.
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_SSO_URL=https://sso.codevertexitsolutions.com
ARG NEXT_PUBLIC_AUTH_API_URL=https://sso.codevertexitsolutions.com
ARG NEXT_PUBLIC_SSO_CLIENT_ID=erp-ui
ARG NEXT_PUBLIC_SUBSCRIPTIONS_API_URL=https://pricingapi.codevertexitsolutions.com
ARG NEXT_PUBLIC_WEBSOCKET_URL=
ARG NEXT_PUBLIC_TREASURY_UI_URL=https://books.codevertexitsolutions.com
ARG NEXT_PUBLIC_MARKETFLOW_UI_URL=https://marketflow.codevertexitsolutions.com
ARG NEXT_PUBLIC_INVENTORY_UI_URL=https://inventory.codevertexitsolutions.com
ARG NEXT_PUBLIC_POS_UI_URL=https://pos.codevertexitsolutions.com
ARG NEXT_PUBLIC_ORDERING_UI_URL=https://ordersapp.codevertexitsolutions.com
ARG NEXT_PUBLIC_NOTIFICATIONS_UI_URL=https://notifications.codevertexitsolutions.com
ARG NEXT_PUBLIC_PROJECTS_UI_URL=https://projects.codevertexitsolutions.com
ARG NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL=https://pricing.codevertexitsolutions.com
ARG NEXT_PUBLIC_AUTH_UI_URL=https://accounts.codevertexitsolutions.com

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SSO_URL=$NEXT_PUBLIC_SSO_URL \
    NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL \
    NEXT_PUBLIC_SSO_CLIENT_ID=$NEXT_PUBLIC_SSO_CLIENT_ID \
    NEXT_PUBLIC_SUBSCRIPTIONS_API_URL=$NEXT_PUBLIC_SUBSCRIPTIONS_API_URL \
    NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL \
    NEXT_PUBLIC_TREASURY_UI_URL=$NEXT_PUBLIC_TREASURY_UI_URL \
    NEXT_PUBLIC_MARKETFLOW_UI_URL=$NEXT_PUBLIC_MARKETFLOW_UI_URL \
    NEXT_PUBLIC_INVENTORY_UI_URL=$NEXT_PUBLIC_INVENTORY_UI_URL \
    NEXT_PUBLIC_POS_UI_URL=$NEXT_PUBLIC_POS_UI_URL \
    NEXT_PUBLIC_ORDERING_UI_URL=$NEXT_PUBLIC_ORDERING_UI_URL \
    NEXT_PUBLIC_NOTIFICATIONS_UI_URL=$NEXT_PUBLIC_NOTIFICATIONS_UI_URL \
    NEXT_PUBLIC_PROJECTS_UI_URL=$NEXT_PUBLIC_PROJECTS_UI_URL \
    NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL=$NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL \
    NEXT_PUBLIC_AUTH_UI_URL=$NEXT_PUBLIC_AUTH_UI_URL

RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir -p .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
