FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
COPY prisma prisma

RUN npm install

COPY . .
ENV DATABASE_URL=postgresql://resource_manager:resource_manager@postgres:5432/resource_manager?schema=public
RUN npx prisma generate
