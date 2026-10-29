import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { prisma } from "../lib/db";

before(() => {
  execFileSync("npx", ["tsx", "prisma/seed.ts"], { stdio: "pipe" });
});

test("seed creates exactly one case with two parties and eight statements", async () => {
  const cases = await prisma.case.findMany({
    include: { parties: { include: { statements: true } } },
  });
  assert.equal(cases.length, 1);
  const c = cases[0];
  assert.equal(c.mode, "COMMON_GROUND_AND_VERDICT");
  assert.equal(c.status, "COLLECTING");
  assert.equal(c.parties.length, 2);
  assert.deepEqual(c.parties.map((p) => p.slot).sort(), ["A", "B"]);
  assert.equal(c.parties.flatMap((p) => p.statements).length, 8);
  for (const p of c.parties) {
    assert.deepEqual(
      p.statements.map((s) => s.kind).sort(),
      ["CONTEXT", "EVIDENCE", "OPENING", "PROPOSAL"],
    );
  }
});

test("the seeded parties store token hashes, not raw tokens", async () => {
  const parties = await prisma.party.findMany();
  for (const p of parties) assert.match(p.tokenHash, /^[0-9a-f]{64}$/);
  assert.notEqual(parties[0].tokenHash, parties[1].tokenHash);
});

test("tokenHash is unique across parties", async () => {
  const [a] = await prisma.party.findMany();
  await assert.rejects(
    prisma.party.update({ where: { id: a.id }, data: { tokenHash: a.tokenHash } }).then(() =>
      prisma.party.updateMany({ data: { tokenHash: a.tokenHash } }),
    ),
  );
});

test("evidence statements keep their links array", async () => {
  const ev = await prisma.statement.findFirst({ where: { kind: "EVIDENCE" } });
  assert.ok(ev);
  assert.ok(Array.isArray(ev.links));
  assert.ok(ev.links.length > 0);
});
