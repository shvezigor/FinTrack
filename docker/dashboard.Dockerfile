FROM node:24-alpine

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json

RUN npm install

COPY . .
RUN npm --workspace apps/dashboard run build

EXPOSE 3000
CMD ["npm", "--workspace", "apps/dashboard", "run", "start"]
