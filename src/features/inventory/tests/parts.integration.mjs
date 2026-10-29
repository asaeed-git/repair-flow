// Run against the local development server: node --test src/features/inventory/tests/parts.integration.mjs
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import pg from "pg";

const baseUrl = process.env.REPAIRFLOW_TEST_URL ?? "http://127.0.0.1:3000";
const databaseUrl = new URL(process.env.DATABASE_URL);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname), "Use your local development database");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseUrl).hostname), "Use the local development app");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const createdIds = [];

async function request(path, method = "GET", body) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  return { status: response.status, body: await response.json() };
}

async function create(overrides = {}) {
  const body = { partCode: `TEST-${randomUUID()}`, name: "Inventory verification", quantity: 2, unitPriceMinor: 250050, lowStockThreshold: 2, ...overrides };
  const result = await request("/parts", "POST", body);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  createdIds.push(result.body.data.id);
  return result.body.data;
}

async function stored(id) {
  return (await pool.query('SELECT * FROM "Part" WHERE id = $1', [id])).rows[0];
}

test("inventory API and PostgreSQL integrity", async (t) => {
  try {
    await t.test("create persists normalized codes, integer paise and UTC timestamps", async () => {
      const part = await create({ partCode: ` test-${randomUUID()} `, name: " Display " });
      assert.equal(part.partCode, part.partCode.trim().toUpperCase());
      assert.equal(part.name, "Display");
      assert.equal(part.unitPriceMinor, 250050);
      assert.match(part.createdAt, /Z$/);
      assert.equal((await stored(part.id)).quantity, 2);
      const duplicate = await request("/parts", "POST", { partCode: part.partCode.toLowerCase(), name: "Duplicate", quantity: 1, unitPriceMinor: 0, lowStockThreshold: 0 });
      assert.equal(duplicate.status, 409);
      assert.ok(duplicate.body.error.fieldErrors.partCode);
    });
    await t.test("pagination has stable name/id order and real totals", async () => {
      const result = await request("/parts?page=1&pageSize=100");
      assert.equal(result.status, 200);
      const expected = (await pool.query('SELECT id FROM "Part" ORDER BY name ASC, id ASC LIMIT 100')).rows.map((row) => row.id);
      assert.deepEqual(result.body.data.map((part) => part.id), expected);
      assert.equal(result.body.meta.total, Number((await pool.query('SELECT count(*) FROM "Part"')).rows[0].count));
      for (const query of ["page=0", "pageSize=101", "page=no", "page=1.5", "page=2147483647&pageSize=100"]) {
        assert.equal((await request(`/parts?${query}`)).status, 400);
      }
    });
    await t.test("server rejects malformed, unknown, fractional, negative and empty input", async () => {
      const part = await create();
      for (const patch of [{}, { quantity: 99 }, { stockAdjustment: 0.5 }, { unitPriceMinor: -1 }, { name: " " }, { lowStockThreshold: 2147483648 }, { partCode: "x".repeat(61) }, { partCode: "ß".repeat(60) }]) {
        assert.equal((await request(`/parts/${part.id}`, "PATCH", patch)).status, 400);
      }
      for (const quantity of [-1, 0.1, "2", null]) {
        assert.equal((await request("/parts", "POST", { partCode: randomUUID(), name: "Invalid", quantity, unitPriceMinor: 0, lowStockThreshold: 0 })).status, 400);
      }
      const expandedCode = await request("/parts", "POST", { partCode: "ß".repeat(60), name: "Invalid expanded code", quantity: 0, unitPriceMinor: 0, lowStockThreshold: 0 });
      assert.equal(expandedCode.status, 400);
      assert.ok(expandedCode.body.error.fieldErrors.partCode);
      const malformed = await fetch(`${baseUrl}/api/parts`, { method: "POST", body: "{", headers: { "Content-Type": "application/json" } });
      assert.equal(malformed.status, 400);
      assert.equal((await request("/parts/not-a-uuid", "PATCH", { name: "Invalid" })).status, 400);
      assert.equal((await request(`/parts/${randomUUID()}`, "PATCH", { name: "Missing" })).status, 404);
    });
    await t.test("failed adjustment rolls back metadata and stock together", async () => {
      const part = await create();
      const result = await request(`/parts/${part.id}`, "PATCH", { name: "Must not persist", stockAdjustment: -3 });
      assert.equal(result.status, 409);
      assert.equal(result.body.error.code, "INSUFFICIENT_STOCK");
      const actual = await stored(part.id);
      assert.equal(actual.quantity, 2);
      assert.equal(actual.name, part.name);
    });
    await t.test("competing stock reductions cannot oversell", async () => {
      const part = await create();
      const results = await Promise.all([1, 2].map(() => request(`/parts/${part.id}`, "PATCH", { stockAdjustment: -2 })));
      assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
      assert.equal((await stored(part.id)).quantity, 0);
    });
    await t.test("simultaneous additions and metadata edits preserve every stock delta", async () => {
      const part = await create({ quantity: 0 });
      const results = await Promise.all([
        request(`/parts/${part.id}`, "PATCH", { stockAdjustment: 2 }),
        request(`/parts/${part.id}`, "PATCH", { stockAdjustment: 3 }),
        request(`/parts/${part.id}`, "PATCH", { name: "Updated display", unitPriceMinor: 100025 }),
      ]);
      assert.ok(results.every((result) => result.status === 200));
      const actual = await stored(part.id);
      assert.equal(actual.quantity, 5);
      assert.equal(actual.name, "Updated display");
      assert.equal(actual.unitPriceMinor, 100025);
    });
    await t.test("stock overflow and duplicate-code edits fail without partial writes", async () => {
      const first = await create({ quantity: 2147483647 });
      const second = await create();
      assert.equal((await request(`/parts/${first.id}`, "PATCH", { stockAdjustment: 1 })).status, 409);
      assert.equal((await stored(first.id)).quantity, 2147483647);
      assert.equal((await request(`/parts/${second.id}`, "PATCH", { partCode: first.partCode.toLowerCase(), stockAdjustment: 1 })).status, 409);
      assert.equal((await stored(second.id)).quantity, 2);
      assert.equal((await stored(second.id)).partCode, second.partCode);
    });
  } finally {
    // Remove only UUIDs created by this run; never touch seed or user records.
    if (createdIds.length) await pool.query('DELETE FROM "Part" WHERE id = ANY($1::uuid[])', [createdIds]);
    await pool.end();
  }
});
