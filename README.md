# CoBuild

CoBuild helps developers, designers, entrepreneurs, and other professionals
discover projects and find compatible people to build with.

## Stack

- **Web:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **API:** NestJS 11, TypeScript, REST, OpenAPI/Swagger
- **Database:** PostgreSQL 17, TypeORM, migrations
- **Tooling:** pnpm workspaces, Turborepo, ESLint, Prettier, Docker Compose

## Repository structure

```text
apps/
  web/        Next.js application
  api/        NestJS application
packages/     Future shared packages
compose.yaml  Local PostgreSQL service
```

## Local setup

Requirements: Node.js 22+, pnpm 11+, and Docker Desktop.

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

- Web: http://localhost:3000
- API health: http://localhost:4000/api/v1/health
- API documentation: http://localhost:4000/docs
- PostgreSQL: `localhost:5433` (container port `5432`)

If you prefer app-local environment files, copy the `.env.example` files inside
`apps/web` and `apps/api`.

## Full Docker stack

Runs PostgreSQL, NestJS API, and Next.js web together:

```bash
cp .env.example .env
pnpm stack:up
pnpm --filter api migration:run   # still manual
```

```bash
pnpm stack:ps
pnpm stack:logs
pnpm stack:down
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health
- Postgres (host): `localhost:5433`

## Commands

```bash
pnpm dev           # Run web and API in watch mode
pnpm build         # Build all applications
pnpm lint          # Lint all applications
pnpm test          # Run unit tests
pnpm format        # Format the repository
pnpm db:up         # Start PostgreSQL only
pnpm db:down       # Stop Compose services
pnpm stack:up      # Build and start web + api + postgres
pnpm stack:down    # Stop the full stack
pnpm stack:logs    # Tail stack logs
pnpm stack:ps      # Show stack status
```

Generate and run database migrations:

```bash
pnpm --filter api migration:generate src/database/migrations/DescriptiveName
pnpm --filter api migration:run
```

## Users API

Authentication:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/password`
- `PATCH /api/v1/auth/email`
- `DELETE /api/v1/auth/account`
- `GET /api/v1/auth/providers`
- `GET /api/v1/auth/google` / `GET /api/v1/auth/github` (optional OAuth)

Core MVP:

- `GET|PUT /api/v1/profiles/me`
- `GET|POST /api/v1/projects`
- `GET /api/v1/projects/mine`
- `GET|PATCH /api/v1/projects/:id`
- `POST /api/v1/projects/:id/archive`
- `GET /api/v1/projects/:id/members`
- `POST /api/v1/projects/:id/applications`
- `GET /api/v1/projects/:id/applications`
- `GET /api/v1/applications/mine`
- `PATCH /api/v1/applications/:id`
- `GET /api/v1/members/mine`
- `GET|PATCH /api/v1/notifications` (+ unread-count, read-all)

Web pages: `/`, `/register`, `/login`, `/auth/callback`, `/dashboard`, `/profile`, `/profile/edit`, `/settings`, `/projects`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit`, `/applications`, `/notifications`.

Interactive docs: http://localhost:4000/docs


## Suggested MVP implementation order

1. Authentication and account security
2. Professional profiles, skills, and preferences
3. Project creation and management
4. Project discovery and search
5. Applications and recruitment
6. In-app notifications and basic recommendations

Real-time collaboration, AI features, and reputation should follow after the
core MVP flow is stable.
