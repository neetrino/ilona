# @ilona/database

Single source of truth for the Ilona English Center database schema and Prisma client.

- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Generated client**: `node_modules/.prisma/client` (inside this package)

## Usage

- **API** depends on this package (`@ilona/database`) and uses `PrismaClient` from here, so the same generated client is always used.
- After cloning or pulling schema/migration changes, run `pnpm install` at the repo root — the `prepare` script runs `prisma generate` automatically.
- To regenerate the client manually (e.g. after editing the schema): `pnpm db:generate`. Stop any running dev server first to avoid file lock (EPERM on Windows).

## Commands

| Command | Description |
|--------|-------------|
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Apply migrations (from repo root: `pnpm db:migrate`) |
| `pnpm db:push` | Push schema without migrations (dev only) |
| `pnpm db:studio` | Open Prisma Studio |
