FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY apps/api ./apps/api

RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod --legacy /prod/api

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=4000

RUN addgroup --system nodejs \
  && adduser --system --ingroup nodejs nestjs

COPY --from=build --chown=nestjs:nodejs /prod/api/package.json ./
COPY --from=build --chown=nestjs:nodejs /prod/api/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist

RUN mkdir -p /app/uploads/avatars \
  && chown -R nestjs:nodejs /app/uploads

USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
