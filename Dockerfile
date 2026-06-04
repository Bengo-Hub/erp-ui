# Multi-stage Dockerfile for Vue ERP UI

FROM node:22.13-slim AS base
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.30.0

# Build-time environment variables (available during pnpm run build)
ARG VITE_API_URL=https://erpapi.masterspace.co.ke
ARG VITE_WEBSOCKET_URL=wss://erpapi.masterspace.co.ke/ws/pos/
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}

# SSO (kept disabled until the erp OAuth client is registered + login is verified) +
# external owner-service UI links shown in the decomposed ERP menu (prod domains).
ARG VITE_SSO_ENABLED=false
ARG VITE_SSO_CLIENT_ID=erp-ui
ARG VITE_SSO_URL=https://sso.codevertexitsolutions.com
ARG VITE_AUTH_URL=https://sso.codevertexitsolutions.com
ARG VITE_AUTH_API_URL=https://sso.codevertexitsolutions.com
ARG VITE_AUTH_UI_URL=https://accounts.codevertexitsolutions.com
ARG VITE_SUBSCRIPTIONS_API_URL=https://pricingapi.codevertexitsolutions.com
ARG VITE_SUBSCRIPTIONS_UI_URL=https://pricing.codevertexitsolutions.com
ARG VITE_TREASURY_UI_URL=https://books.codevertexitsolutions.com
ARG VITE_MARKETFLOW_UI_URL=https://marketflow.codevertexitsolutions.com
ARG VITE_INVENTORY_UI_URL=https://inventory.codevertexitsolutions.com
ARG VITE_POS_UI_URL=https://pos.codevertexitsolutions.com
ARG VITE_ORDERING_UI_URL=https://ordersapp.codevertexitsolutions.com
ARG VITE_NOTIFICATIONS_UI_URL=https://notifications.codevertexitsolutions.com
ARG VITE_PROJECTS_UI_URL=https://projects.codevertexitsolutions.com
ENV VITE_SSO_ENABLED=${VITE_SSO_ENABLED} \
    VITE_SSO_CLIENT_ID=${VITE_SSO_CLIENT_ID} \
    VITE_SSO_URL=${VITE_SSO_URL} \
    VITE_AUTH_URL=${VITE_AUTH_URL} \
    VITE_AUTH_API_URL=${VITE_AUTH_API_URL} \
    VITE_AUTH_UI_URL=${VITE_AUTH_UI_URL} \
    VITE_SUBSCRIPTIONS_API_URL=${VITE_SUBSCRIPTIONS_API_URL} \
    VITE_SUBSCRIPTIONS_UI_URL=${VITE_SUBSCRIPTIONS_UI_URL} \
    VITE_TREASURY_UI_URL=${VITE_TREASURY_UI_URL} \
    VITE_MARKETFLOW_UI_URL=${VITE_MARKETFLOW_UI_URL} \
    VITE_INVENTORY_UI_URL=${VITE_INVENTORY_UI_URL} \
    VITE_POS_UI_URL=${VITE_POS_UI_URL} \
    VITE_ORDERING_UI_URL=${VITE_ORDERING_UI_URL} \
    VITE_NOTIFICATIONS_UI_URL=${VITE_NOTIFICATIONS_UI_URL} \
    VITE_PROJECTS_UI_URL=${VITE_PROJECTS_UI_URL}

COPY package.json pnpm-lock.yaml .npmrc ./
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN --mount=type=ssh pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm run build

FROM node:22.13-alpine AS runtime
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.30.0

RUN apk update && apk upgrade
COPY --from=base --chown=node:node /app .
RUN chown -R node:node /app
ENV NODE_ENV=production PORT=3000
USER node

EXPOSE 3000

# If this UI has a Node server entry point use it; otherwise build static and serve with a simple server
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://localhost:${PORT}/ || exit 1
CMD ["pnpm","run","start"]


