# API contract v1 (agreed design; endpoints not implemented yet)
JSON camelCase. UUID path IDs. Date strings are UTC ISO 8601.
Success: { "data": ... }. Lists add "meta": { "page": 1, "pageSize": 20, "total": 0 }.
Errors: { "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields", "fieldErrors": {} } }.
400 invalid input, 404 absent record, 409 stock/duplicate/status conflict, 500 unexpected error (no internal details).
POST returns 201; GET/PATCH return 200; successful DELETE returns 204 without a body.

## Abbas
GET /api/tickets?q=&status=&technicianId=&page=1&pageSize=20
q searches ticketNumber or customerName, case-insensitively. Filters combine with AND.
Sort registeredAt descending then id. page >= 1, pageSize 1..100.
Return Ticket fields from schema plus technician: { id, name } | null.
POST /api/tickets
Example: { "customerName": "Demo Customer", "customerPhone": "+91 9000000000", "deviceName": "Smartphone", "deviceType": "Phone", "problemDescription": "Broken display", "priority": "MEDIUM", "technicianId": null }
Server sets id, ticketNumber, NEW status, timestamps.
GET /api/tickets/:id returns the same ticket shape.
PATCH /api/tickets/:id accepts any subset of editable customer/device/problem/priority fields, status, technicianId.
Empty patches and unknown fields are rejected. ID, number and dates are immutable.
Status advances one step or stays unchanged; other transitions return 409 INVALID_STATUS_TRANSITION.
GET /api/technicians?page=1&pageSize=20 returns paginated Technician records.
POST /api/technicians accepts { "name": "Technician name", "phone": "+91 9000000000" }; phone optional.
Use GET /api/tickets?technicianId=UUID to view assigned repairs.

## Arhan
GET /api/parts?page=1&pageSize=20 returns paginated Part records, sorted name then id.
POST /api/parts accepts { "partCode": "DISPLAY-01", "name": "Replacement display", "quantity": 2, "unitPriceMinor": 250000, "lowStockThreshold": 2 }.
Normalize partCode to uppercase and trim before uniqueness checking.
PATCH /api/parts/:id edits name, partCode, unitPriceMinor, lowStockThreshold.
For stock changes accept stockAdjustment as a signed integer delta, not an absolute quantity; decrement conditionally and reject negative resulting stock.
GET /api/tickets/:id/allocations returns { "data": [Allocation with part: { id, name, partCode }] }.
POST /api/tickets/:id/allocations accepts { "items": [{ "partId": "UUID", "quantity": 1 }] } and returns created allocations.
Empty items rejected. Snapshot each current part unitPriceMinor. Missing ticket/part: 404.
Insufficient stock: 409 INSUFFICIENT_STOCK; no partial writes.
DELETE /api/allocations/:id removes allocation and restores stock atomically. Missing/already removed: 404.
GET /api/dashboard returns { "data": { "totalRepairs": 0, "inProgress": 0, "completed": 0, "delivered": 0, "lowStockParts": [] } }.
lowStockParts contains Part records where quantity < lowStockThreshold.

## Client integration
Search UI consumes Abbas's ticket endpoint; do not create a competing ticket endpoint.
Refresh affected ticket lists, allocations, inventory, and dashboard after mutations.
All mutation endpoints validate server-side; never trust browser quantities or prices.
