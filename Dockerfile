FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

COPY apps/api apps/api
COPY packages/database packages/database
COPY packages/types packages/types

RUN pnpm install --frozen-lockfile

RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public" pnpm build:api

ENV NODE_ENV=production

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["node", "dist/main.js"]
