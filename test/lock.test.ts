import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as createCase } from "../app/api/cases/route";
import { PUT as putStatement } from "../app/api/p/[token]/statements/[kind]/route";
import { POST as lockParty } from "../app/api/p/[token]/lock/route";
import { prisma } from "../lib/db";
import { _reset as resetRateLimit } from "../lib/ratelimit";
import { setProvider, resetProvider } from "../lib/judge/provider";
import type { JudgeResult } from "../lib/judge/schema";
import { mockJudge } from "../lib/judge/mock";

async function makeCase() {
  const res = await createCase(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Trip", mode: "COMMON_GROUND_AND_VERDICT" }),
  }));
  const { caseId, links } = await res.json();
  const a = links.a.replace("/p/", "");
  const b = links.b.replace("/p/", "");
  for (const token of [a, b]) {
    await putStatement(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: `${token} says the deposit should be split.` }),
      }),
      { params: Promise.resolve({ token, kind: "OPENING" }) },
    );
  }
  return { caseId, a, b };
}

const lock = (token: string) =>
  lockParty(new Request(`http://localhost/api/p/${token}/lock`, { method: "POST" }), {
    params: Promise.resolve({ token }),
  });

let calls = 0;
beforeEach(async () => {
  await prisma.case.deleteMany();
  resetRateLimit(); // the limiter is process-global; these suites open more than its hourly cap
  calls = 0;
});
afterEach(() => resetProvider());

const counting = (impl = mockJudge) =>
  setProvider(async (input): Promise<{ result: JudgeResult; model: string }> => {
    calls++;
    return impl(input);
  });

test("locking the first party leaves the case COLLECTING and runs no judge", async () => {
  counting();
  const { caseId, a } = await makeCase();

  const res = await lock(a);
  assert.equal(res.status, 200);
  assert.equal(calls, 0);

  const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId } });
  assert.equal(c.status, "COLLECTING");
  const party = await prisma.party.findFirstOrThrow({ where: { caseId, slot: "A" } });
  assert.ok(party.lockedAt, "lockedAt was not set");
});

test("locking the second party runs the judge exactly once and decides the case", async () => {
  counting();
  const { caseId, a, b } = await makeCase();

  await lock(a);
  const res = await lock(b);
  assert.equal(res.status, 200);
  assert.equal(calls, 1);

  const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, include: { verdict: true } });
  assert.equal(c.status, "DECIDED");
  assert.ok(c.verdict, "no verdict row was written");
  assert.equal(typeof (c.verdict!.json as Record<string, unknown>).summary_neutral, "string");
});

test("two concurrent locks of the second party still run the judge exactly once", async () => {
  counting();
  const { caseId, a, b } = await makeCase();
  await lock(a);

  const results = await Promise.all([lock(b), lock(b), lock(b)]);
  for (const r of results) assert.ok(r.status < 500, `lock returned ${r.status}`);

  assert.equal(calls, 1, "the judge ran more than once");
  assert.equal(await prisma.verdict.count({ where: { caseId } }), 1);
  assert.equal((await prisma.case.findUniqueOrThrow({ where: { id: caseId } })).status, "DECIDED");
});

test("locking twice is idempotent and does not re-run the judge", async () => {
  counting();
  const { caseId, a, b } = await makeCase();
  await lock(a);
  await lock(b);
  assert.equal(calls, 1);

  const again = await lock(b);
  assert.equal(again.status, 200);
  assert.equal(calls, 1);
  assert.equal(await prisma.verdict.count({ where: { caseId } }), 1);
});

test("a judge that throws leaves the case FAILED, not stuck in JUDGING", async () => {
  setProvider(async () => {
    calls++;
    throw new Error("Bedrock said no");
  });
  const { caseId, a, b } = await makeCase();
  await lock(a);
  await lock(b);

  assert.equal(calls, 1);
  const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId } });
  assert.equal(c.status, "FAILED");
  assert.equal(await prisma.verdict.count({ where: { caseId } }), 0);
});

test("the judge is given neutral Person 1 / Person 2 labels and the mapping is recorded", async () => {
  let seen: { person1: string; person2: string } | null = null;
  setProvider(async (input) => {
    seen = { person1: input.person1.opening, person2: input.person2.opening };
    return mockJudge(input);
  });
  const { caseId, a, b } = await makeCase();
  await lock(a);
  await lock(b);

  assert.ok(seen, "the provider was never called");
  const verdict = await prisma.verdict.findUniqueOrThrow({ where: { caseId } });
  const json = verdict.json as { assignment?: { person1: string; person2: string } };
  assert.ok(json.assignment, "the Person 1/2 mapping was not stored");
  assert.deepEqual([json.assignment!.person1, json.assignment!.person2].sort(), ["A", "B"]);
});

test("an unknown token cannot lock", async () => {
  counting();
  await makeCase();
  const res = await lock("not-a-token");
  assert.equal(res.status, 404);
  assert.equal(calls, 0);
});
