import assert from "node:assert/strict";
import { test } from "node:test";
import { readLimitedJson } from "../lib/showcase/limited-json";

test("showcase JSON parser accepts bounded valid JSON and rejects malformed bodies", async () => {
  assert.deepEqual(await readLimitedJson(new Request("https://lablink.test", { method: "POST", body: JSON.stringify({ ok: true }) })), { ok: true, value: { ok: true } });
  const invalid = await readLimitedJson(new Request("https://lablink.test", { method: "POST", body: "{" }));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.status, 400);
});

test("showcase JSON parser enforces request byte limits", async () => {
  const response = await readLimitedJson(new Request("https://lablink.test", { method: "POST", body: JSON.stringify({ data: "x".repeat(100) }) }), 32);
  assert.equal(response.ok, false);
  if (!response.ok) assert.equal(response.status, 413);
});
