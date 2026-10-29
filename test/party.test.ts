import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST as createCase } from "../app/api/cases/route";
import { GET as getParty } from "../app/api/p/[token]/route";
import { PUT as putStatement } from "../app/api/p/[token]/statements/[kind]/route";
import { prisma } from "../lib/db";
import { hashToken } from "../lib/tokens";

type Links = { a: string; b: string };

async function makeCase(mode = "COMMON_GROUND_AND_VERDICT"): Promise<{ caseId: string; a: string; b: string }> {
  const res = await createCase(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.2" },
    body: JSON.stringify({ title: "Trip", mode }),
  }));
  const { caseId, links } = (await res.json()) as { caseId: string; links: Links };
  return { caseId, a: links.a.replace("/p/", ""), b: links.b.replace("/p/", "") };
}

const get = (token: string) =>
  getParty(new Request(`http://localhost/api/p/${token}`), { params: Promise.resolve({ token }) });

const put = (token: string, kind: string, body: unknown) =>
  putStatement(
    new Request(`http://localhost/api/p/${token}/statements/${kind}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token, kind }) },
  );

beforeEach(async () => {
  await prisma.case.deleteMany();
});

test("GET returns the case, the mode, own statements and lock status", async () => {
  const { a } = await makeCase();
  await put(a, "OPENING", { body: "She cancelled the trip." });

  const res = await get(a);
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.case.title, "Trip");
  assert.equal(body.case.mode, "COMMON_GROUND_AND_VERDICT");
  assert.equal(body.case.status, "COLLECTING");
  assert.equal(body.you.slot, "A");
  assert.equal(body.you.locked, false);
  assert.equal(body.you.statements.OPENING.body, "She cancelled the trip.");
  assert.equal(body.other.locked, false);
});

test("GET never exposes the other party's text while COLLECTING", async () => {
  const { a, b } = await makeCase();
  await put(b, "OPENING", { body: "SECRET-B-TEXT" });

  const dump = JSON.stringify(await (await get(a)).json());
  assert.ok(!dump.includes("SECRET-B-TEXT"), "other party's statement leaked before the verdict");
  assert.ok(!dump.includes(hashToken(b)), "token hash leaked to the client");
  assert.ok(!dump.includes(b), "other party's raw token leaked");
});

test("an unknown token is 404", async () => {
  const res = await get("not-a-real-token");
  assert.equal(res.status, 404);
});

test("PUT autosaves and upserts each of the four kinds", async () => {
  const { a } = await makeCase();
  for (const kind of ["OPENING", "CONTEXT", "PROPOSAL", "EVIDENCE"]) {
    assert.equal((await put(a, kind, { body: `first ${kind}` })).status, 200);
    assert.equal((await put(a, kind, { body: `second ${kind}` })).status, 200);
  }
  const body = await (await get(a)).json();
  assert.equal(body.you.statements.CONTEXT.body, "second CONTEXT");
  assert.equal(
    await prisma.statement.count({ where: { party: { tokenHash: hashToken(a) } } }),
    4,
    "upsert created duplicate rows",
  );
});

test("PUT rejects an unknown kind, an over-long body, too many links, and non-URL links", async () => {
  const { a } = await makeCase();
  assert.equal((await put(a, "RANT", { body: "hi" })).status, 400);
  assert.equal((await put(a, "OPENING", { body: "x".repeat(4001) })).status, 400);
  assert.equal((await put(a, "OPENING", { body: "x".repeat(4000) })).status, 200);
  assert.equal(
    (await put(a, "EVIDENCE", { body: "ok", links: Array(6).fill("https://example.com") })).status,
    400,
  );
  assert.equal((await put(a, "EVIDENCE", { body: "ok", links: ["not a url"] })).status, 400);
  assert.equal(
    (await put(a, "EVIDENCE", { body: "ok", links: ["https://example.com/a", "https://example.com/b"] })).status,
    200,
  );
});

test("PUT is rejected with 409 once the party has locked", async () => {
  const { a } = await makeCase();
  await put(a, "OPENING", { body: "before lock" });
  await prisma.party.updateMany({ where: { tokenHash: hashToken(a) }, data: { lockedAt: new Date() } });

  const res = await put(a, "OPENING", { body: "after lock" });
  assert.equal(res.status, 409);
  const s = await prisma.statement.findFirstOrThrow({ where: { kind: "OPENING", party: { tokenHash: hashToken(a) } } });
  assert.equal(s.body, "before lock");
});

test("a party can only write to their own statements", async () => {
  const { a, b } = await makeCase();
  await put(a, "OPENING", { body: "A text" });
  await put(b, "OPENING", { body: "B text" });

  const aStatements = await prisma.statement.findMany({ where: { party: { tokenHash: hashToken(a) } } });
  assert.equal(aStatements.length, 1);
  assert.equal(aStatements[0].body, "A text");
});
