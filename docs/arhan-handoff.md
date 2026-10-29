# RepairFlow — Arhan's agent handoff
You assist Arhan, Member 2. Abbas is Member 1 and integration lead.
This repository is the shared foundation, not a completed application MVP.
Read AGENTS.md, docs/foundation.md, docs/api-contract.md, and docs/local-database.md first.

## Start
1. Clone https://github.com/asaeed-git/repair-flow.git.
2. Create feature/inventory-dashboard from the published main foundation.
3. Confirm Arhan's Git email and configure repository-local author name Arhan.
4. Use Node 24.14.1 and npm 11.11.0; run npm ci. Never create another starter.
5. Install PostgreSQL 17 locally using docs/local-database.md. Use your own password and database.
6. Apply migrations and run the optional seed. Ticket UUID 22222222-2222-4222-8222-222222222222 is available after seeding.
7. Run the app and inspect its shared UI in the development browser.

## Your scope
Inventory CRUD, atomic allocation/removal, dashboard, and search/filter interface.
Start with inventory CRUD. Abbas owns ticket/technician endpoints, status changes and assignments.
Search consumes GET /api/tickets; it must not introduce a second implementation.
Until that API exists, use a replaceable development fixture for UI work, clearly labelled; do not ship hardcoded production records.

## Ownership boundaries
Use src/features/inventory, src/features/dashboard, src/features/search.
Add concrete src/app/inventory, src/app/dashboard, src/app/search pages and your agreed API routes.
The temporary dynamic [module] page is a fallback; do not edit it to implement your modules.
Export an allocation component accepting ticketId from your inventory feature; Abbas will embed it.
Coordinate changes to schema/migrations, shared UI, globals, package files and API contracts through Arhan and Abbas.
Do not edit Abbas's repair/technician implementation.

## Work rules
Proceed milestone by milestone, explaining and verifying each.
Ask before staging and committing (one combined approval is fine); ask separately before pushing.
Use Arhan's identity, not Abbas's. Do not force-push.
Use the development browser for functional checks and mobile layout checks. Report verification limits honestly.
Reuse shared design tokens and UI components. Do not add fake operational totals.

## Required inventory behavior
Use positive integer quantities, nonnegative stock and integer paise.
Allocate through conditional stock decrement plus allocation insert in one database transaction.
Multi-item allocations are all-or-nothing; aggregate duplicate part IDs first.
Removing an allocation restores stock exactly once, even with concurrent/repeated requests.
Test insufficient stock, competing allocations, rollback and repeated removal.
Stock editing uses stockAdjustment deltas, not stale absolute quantities.
Keep basic local development scope; no production hosting or extra infrastructure is needed.

First report that setup works, then implement inventory CRUD.
