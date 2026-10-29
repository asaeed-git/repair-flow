# RepairFlow
An eight-hour, two-person repair shop practice project.

- Abbas: repair tickets, technicians, assignments, workflow and shared foundation.
- Arhan: inventory, atomic part allocation, dashboard and search UI.

## Current milestone: shared foundation
Includes a responsive app shell, placeholder module routes, shared UI primitives, validation contracts,
PostgreSQL schema/migration, and an optional persisted development fixture.
Repair/inventory CRUD and dashboard APIs are not implemented yet. This is the starter for parallel development.

## Start locally
Use Node 24.14.1, npm 11.11.0 and PostgreSQL 17.
Each teammate runs a separate local database. Follow [database setup](docs/local-database.md), then:

    npm ci
    npm run db:generate
    npm run db:deploy
    npm run db:check
    npm run db:seed
    npm run dev

Open http://localhost:3000. DATABASE_URL belongs in the ignored .env file.
Do not commit credentials. db:seed is optional and preserves existing sample records.

## Shared agreements
- [Foundation and ownership](docs/foundation.md)
- [API contract](docs/api-contract.md)
- [Arhan's agent handoff](docs/arhan-handoff.md)
- [Contribution log](docs/contributions.md)

Both feature branches must start from the published foundation on main.
Abbas: feature/repair-operations. Arhan: feature/inventory-dashboard.
Ask before staging/committing and ask separately before pushing.

## Checks
    npm run typecheck
    npm run build
    npm run db:validate
    npm run db:check

Production builds use Next.js's supported webpack option because Turbopack failed on the initial Windows machine.
The schema includes stock constraints and ticket-number sequences; use migrations rather than db push.
Functional database checks require the local database setup first.
