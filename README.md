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

## Commands

```bash
pnpm dev           # Run web and API in watch mode
pnpm build         # Build all applications
pnpm lint          # Lint all applications
pnpm test          # Run unit tests
pnpm format        # Format the repository
pnpm db:up         # Start PostgreSQL
pnpm db:down       # Stop local services
```

Generate and run database migrations:

```bash
pnpm --filter api migration:generate src/database/migrations/DescriptiveName
pnpm --filter api migration:run
```

## Suggested MVP implementation order

1. Authentication and account security
2. Professional profiles, skills, and preferences
3. Project creation and management
4. Project discovery and search
5. Applications and recruitment
6. In-app notifications and basic recommendations

Real-time collaboration, AI features, and reputation should follow after the
core MVP flow is stable.
