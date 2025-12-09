FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/abyssos-portal/package.json ./apps/abyssos-portal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/abyssos-portal ./apps/abyssos-portal
COPY turbo.json ./

EXPOSE 5173

WORKDIR /app/apps/abyssos-portal

CMD ["pnpm", "dev", "--host"]

