import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as createCase } from "../app/api/cases/route";
import { PUT as putStatement } from "../app/api/p/[token]/statements/[kind]/route";
import { POST as lockParty } from "../app/api/p/[token]/lock/route";
import { GET as getParty } from "../app/api/p/[token]/route";
import { POST as retryCase } from "../app/api/cases/[id]/retry/route";
import { prisma } from "../lib/db";
import { _reset as resetRateLimit } from "../lib/ratelimit";
import { setProvider, resetProvider } from "../lib/judge/provider";
import { mockJudge } from "../lib/judge/mock";
import type { JudgeResult } from "../lib/judge/schema";

async function makeCase(mode = "COMMON_GROUND_AND_VERDICT") {
  const res = await createCase(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Trip", mode }),
  }));
  const { caseId, links } = await res.json();
  const a = links.a.replace("/p/", "");
  const b = links.b.replace("/p/", "");
  for (const [token, name] of [[a, "Aarav"], [b, "Bela"]] as const) {
    await prisma.party.updateMany({ where: { caseId, slot: token === a ? "A" : "B" }, data: { displayName: name } });
    await putStatement(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: `${name} says the deposit should be split.` }),
      }),
      { params: Promise.resolve({ token, kind: "OPENING" }) },
    );
  }
  return { caseId, a, b };
}

const lock = (token: string) =>
  lockParty(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ token }) });
const get = (token: string) =>
  getParty(new Request("http://localhost/x"), { params: Promise.resolve({ token }) });
const retry = (id: string, token?: string) =>
  retryCase(
    new Request("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(token ? { token } : {}),
    }),
    { params: Promise.resolve({ id }) },
  );

const withFault = (over: Partial<JudgeResult>) =>
  setProvider(async (input) => {
    const base = await mockJudge(input);
    return { ...base, result: { ...base.result, ...over } };
  });

beforeEach(async () => {
  await prisma.case.deleteMany();
  resetRateLimit(); // the limiter is process-global; these suites open more than its hourly cap
});
afterEach(() => resetProvider());

test("a case still JUDGING returns a waiting state and no verdict", async () => {
  setProvider(async () => {
    throw new Error("never finishes");
  });
  const { caseId, a, b } = await makeCase();
  await lock(a);
  await prisma.case.update({ where: { id: caseId }, data: { status: "JUDGING" } });

  const body = await (await get(a)).json();
  assert.equal(body.case.status, "JUDGING");
  assert.equal(body.verdict, null);
  void b;
});

test("a DECIDED case returns the verdict with Person A and B mapped back to names", async () => {
  setProvider(mockJudge);
  const { a, b } = await makeCase();
  await lock(a);
  await lock(b);

  const body = await (await get(a)).json();
  assert.equal(body.case.status, "DECIDED");
  assert.ok(body.verdict, "no verdict returned");
  assert.equal(typeof body.verdict.summary_neutral, "string");
  assert.ok(body.verdict.proposed_resolution.length >= 1);
  assert.deepEqual(body.verdict.names, { A: "Aarav", B: "Bela" });
  assert.ok(!("assignment" in body.verdict), "the Person 1/2 mapping leaked to the client");
});

test("both links show the same verdict, and each side's own text is returned once decided", async () => {
  setProvider(mockJudge);
  const { a, b } = await makeCase();
  await lock(a);
  await lock(b);

  const fromA = await (await get(a)).json();
  const fromB = await (await get(b)).json();
  assert.deepEqual(fromA.verdict, fromB.verdict);
  assert.equal(fromA.other.statements.OPENING.body, "Bela says the deposit should be split.");
  assert.equal(fromB.other.statements.OPENING.body, "Aarav says the deposit should be split.");
});

test("fault_view is withheld in COMMON_GROUND mode even when the judge states one", async () => {
  withFault({ fault_view: { stated: true, text: "Person 1 was wrong.", confidence: "high" } });
  const { a, b } = await makeCase("COMMON_GROUND");
  await lock(a);
  await lock(b);

  const body = await (await get(a)).json();
  assert.equal(body.verdict.fault_view, null, "a fault view escaped a common-ground case");
  assert.ok(!JSON.stringify(body).includes("Person 1 was wrong"));
});

test("fault_view is passed through in verdict mode when the judge states one", async () => {
  withFault({ fault_view: { stated: true, text: "Person 1 moved the date without saying so.", confidence: "medium" } });
  const { a, b } = await makeCase("COMMON_GROUND_AND_VERDICT");
  await lock(a);
  await lock(b);

  const body = await (await get(a)).json();
  assert.equal(body.verdict.fault_view.stated, true);
  assert.equal(body.verdict.fault_view.confidence, "medium");
});

test("a safety flag replaces the verdict with help, on both links", async () => {
  withFault({ safety_flag: "possible_abuse", summary_neutral: "SENSITIVE SUMMARY" });
  const { a, b } = await makeCase();
  await lock(a);
  await lock(b);

  for (const token of [a, b]) {
    const body = await (await get(token)).json();
    assert.equal(body.verdict.safety_flag, "possible_abuse");
    assert.equal(body.verdict.summary_neutral, undefined, "the verdict body survived a safety flag");
    assert.equal(body.verdict.proposed_resolution, undefined);
    assert.ok(body.verdict.help.length > 0, "no help message in place of the verdict");
    assert.ok(!JSON.stringify(body.verdict).includes("SENSITIVE SUMMARY"));
  }
});

test("retry needs a party token, and only works from FAILED", async () => {
  setProvider(async () => {
    throw new Error("Bedrock said no");
  });
  const { caseId, a, b } = await makeCase();
  await lock(a);
  await lock(b);
  assert.equal((await prisma.case.findUniqueOrThrow({ where: { id: caseId } })).status, "FAILED");

  assert.equal((await retry(caseId)).status, 401);
  assert.equal((await retry(caseId, "not-a-token")).status, 401);

  setProvider(mockJudge);
  const ok = await retry(caseId, a);
  assert.equal(ok.status, 200);
  assert.equal((await prisma.case.findUniqueOrThrow({ where: { id: caseId } })).status, "DECIDED");

  // A decided case is not retried again.
  assert.equal((await retry(caseId, a)).status, 409);
  void b;
});
