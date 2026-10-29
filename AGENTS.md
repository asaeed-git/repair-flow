# RepairFlow agent instructions

Work incrementally. Abbas owns repairs and technicians; Arhan owns inventory, allocations, dashboard and search UI. Read docs/foundation.md and docs/api-contract.md before implementation.
Use the committed lockfile with npm ci; do not scaffold another application.
Coordinate shared schema, migration, dependency, design-token and contract changes with Abbas.
Ask before git add and commit (combined permission is allowed). Ask separately before pushing. Never force-push.
Use the developer's own Git identity. Abbas's repository-local identity is Abbas.
Verify working features in the development browser and on mobile. Report any verification limits.
Do not claim placeholder modules are functional. Do not add fake operational totals.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
