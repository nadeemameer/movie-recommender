# Production Dockerfile — used by Render / Fly.io / any Docker host.
# For local dev, `Dockerfile` (with nodemon + bind mounts) is used by
# docker-compose.yml instead.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# --omit=dev skips nodemon and other dev-only packages, keeping the image small
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Run as the unprivileged "node" user that ships in the base image
USER node
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src

EXPOSE 4000
CMD ["node", "src/index.js"]
