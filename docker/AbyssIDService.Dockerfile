FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/abyssid-service/package.json ./apps/abyssid-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/abyssid-service ./apps/abyssid-service
COPY turbo.json ./

# Build
RUN pnpm --filter @demiurge/abyssid-service build

EXPOSE 8082

WORKDIR /app/apps/abyssid-service

CMD ["node", "dist/index.js"]

