import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/cases/route";
import { prisma } from "../lib/db";
import { _reset as resetRateLimit } from "../lib/ratelimit";
import { hashToken, newToken } from "../lib/tokens";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
    body: JSON.stringify(body),
  }));

beforeEach(async () => {
  await prisma.case.deleteMany();
  resetRateLimit(); // the limiter is process-global; these suites open more than its hourly cap
});

test("newToken produces distinct, unguessable tokens and hashToken is sha256 hex", () => {
  const a = newToken();
  const b = newToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 43);
  assert.match(hashToken(a), /^[0-9a-f]{64}$/);
  assert.equal(hashToken(a), hashToken(a));
});

test("POST /api/cases returns a case id and two distinct party links", async () => {
  const res = await post({ title: "Who forgot the anniversary", mode: "COMMON_GROUND_AND_VERDICT" });
  assert.equal(res.status, 201);
  const body = await res.json();

  assert.ok(body.caseId);
  assert.match(body.links.a, /^\/p\/[A-Za-z0-9_-]{20,}$/);
  assert.match(body.links.b, /^\/p\/[A-Za-z0-9_-]{20,}$/);
  assert.notEqual(body.links.a, body.links.b);

  const c = await prisma.case.findUniqueOrThrow({
    where: { id: body.caseId },
    include: { parties: true },
  });
  assert.equal(c.title, "Who forgot the anniversary");
  assert.equal(c.mode, "COMMON_GROUND_AND_VERDICT");
  assert.equal(c.status, "COLLECTING");
  assert.deepEqual(c.parties.map((p) => p.slot).sort(), ["A", "B"]);
});

test("the database stores only token hashes, never the raw tokens", async () => {
  const res = await post({ title: "Dishes", mode: "COMMON_GROUND" });
  const { links } = await res.json();
  const rawA = links.a.replace("/p/", "");
  const rawB = links.b.replace("/p/", "");

  const parties = await prisma.party.findMany();
  const hashes = parties.map((p) => p.tokenHash);
  assert.ok(!hashes.includes(rawA) && !hashes.includes(rawB));
  assert.deepEqual(hashes.map(String).sort(), [hashToken(rawA), hashToken(rawB)].sort());

  const dump = JSON.stringify(await prisma.case.findMany({ include: { parties: true } }));
  assert.ok(!dump.includes(rawA), "raw token A leaked into the database");
  assert.ok(!dump.includes(rawB), "raw token B leaked into the database");
});

test("mode defaults to COMMON_GROUND when omitted", async () => {
  const res = await post({ title: "Loud music" });
  const { caseId } = await res.json();
  const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId } });
  assert.equal(c.mode, "COMMON_GROUND");
});

test("an invalid body is rejected with 400 and creates nothing", async () => {
  for (const bad of [{}, { title: "" }, { title: "x".repeat(201) }, { title: "ok", mode: "NOPE" }]) {
    const res = await post(bad);
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(bad)}`);
  }
  assert.equal(await prisma.case.count(), 0);
});

test("malformed JSON is rejected with 400", async () => {
  const res = await POST(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not json",
  }));
  assert.equal(res.status, 400);
});
