# Shared foundation
Owner: Abbas. Member 2: Arhan.

## Stack and setup
Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL 17, Prisma 7, Zod, npm.
The package lock fixes exact dependencies. Node 24.14.1; npm 11.11.0.
Prisma 7.10.1 is pinned with its PostgreSQL adapter; both developers must use the same locked version.
Each developer uses an independent PostgreSQL instance with identical migrations. Never share local database credentials as production credentials.

## Ownership
Abbas: src/features/repairs, src/features/technicians; /tickets and /technicians pages and APIs.
Arhan: src/features/inventory, src/features/dashboard, src/features/search; /inventory, /dashboard, /search and their APIs.
Shared: src/components/ui, src/lib, prisma, app layout/global styles, package files. Coordinate before editing.
The temporary src/app/[module]/page.tsx supplies clearly labelled placeholders. Add concrete route folders as each module is implemented.
Arhan supplies an allocation component accepting ticketId; Abbas embeds it on the ticket detail page.

## Data and behavior
UUID IDs connect all entities. Display ticket numbers use a database sequence RF-000001; never count rows to generate IDs.
Dates: UTC ISO 8601. Currency: INR, integer paise. Stock/threshold: nonnegative integer. Allocation quantity: positive integer.
Statuses: NEW -> IN_PROGRESS -> READY_FOR_PICKUP -> DELIVERED. Same-status updates are harmless. No backward transition in initial scope.
Priorities LOW/MEDIUM/HIGH; default MEDIUM. New tickets start NEW. Unassigned technicianId is null.
Completed dashboard count includes READY_FOR_PICKUP and DELIVERED; also return delivered separately.
Low stock means quantity < lowStockThreshold.
No hard delete of tickets or parts in the initial scope.

## Inventory integrity
Conditional stock decrements and allocation inserts must share a transaction. For multiple items, aggregate repeated part IDs and process in sorted order; all succeed or all roll back.
Allocation removal must delete/claim the allocation and restore stock in the same transaction. Concurrent or repeated removal must not credit twice.
Test concurrent allocations, rollback, and repeated deletion. Do not overwrite stock based on stale browser values.

## Design
Light slate canvas, white cards, indigo primary actions. Reuse global tokens and shared UI components.
Readable status text alongside colors, labelled fields, field-level errors, loading and empty states.
Test desktop and mobile. No fabricated dashboard statistics.

## Git
main is the shared baseline. Branches: feature/repair-operations and feature/inventory-dashboard.
Start both branches from the same foundation commit. Integrate periodically.
Ask for staging/commit approval together, and separate push approval.


Production builds use Next.js's supported --webpack option because Turbopack failed on the initial Windows machine.

Agreed database setup: separate native Windows PostgreSQL 17 installations. Docker is not part of the baseline. Follow docs/local-database.md.
