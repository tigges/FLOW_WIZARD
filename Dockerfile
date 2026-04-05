# Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/packages/frontend
COPY packages/frontend/package*.json ./
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

# Build backend
FROM node:22-alpine AS backend-build
WORKDIR /app/packages/backend
COPY packages/backend/package*.json ./
RUN npm ci
COPY packages/backend/ ./
RUN npx tsc

# Production image
FROM node:22-alpine
WORKDIR /app

COPY packages/backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-build /app/packages/backend/dist/ ./dist/
COPY --from=frontend-build /app/packages/frontend/dist/ ./public/

# Copy docs for capabilities endpoint mock data fallback
COPY docs/api/mocks/responses/11-provider-capabilities.response.json ./docs/api/mocks/responses/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
