import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as createCase } from "../app/api/cases/route";
import { PUT as putStatement } from "../app/api/p/[token]/statements/[kind]/route";
import { POST as lockParty } from "../app/api/p/[token]/lock/route";
import { partyView } from "../lib/party";
import { inlineJudge, stopInlineJudge, judged } from "./judge-inline";
import { prisma } from "../lib/db";
import { _reset as resetRateLimit } from "../lib/ratelimit";
import { setProvider, resetProvider } from "../lib/judge/provider";
import type { JudgeResult } from "../lib/judge/schema";

/**
 * Person 1 / Person 2 are dealt to the two slots at random, so the mediator's
 * own "a" and "b" mean "the first account I was shown" and "the second". The
 * page labels them with slot A's and slot B's names. Those two only line up
 * when the coin came down one way.
 */

const realRandom = Math.random;
beforeEach(async () => {
  inlineJudge();
  await prisma.case.deleteMany();
  resetRateLimit();
});
afterEach(() => {
  stopInlineJudge();
  Math.random = realRandom;
  resetProvider();
});

/** Answers with whatever it was shown, so each field says which account it came from. */
const echo = () =>
  setProvider(async (input): Promise<{ result: JudgeResult; model: string }> => ({
    model: "echo",
    result: {
      summary_neutral: "x",
      agreed_facts: [],
      disputed_facts: [
        { issue: "who", a_says: input.personA.opening, b_says: input.personB.opening },
      ],
      needs_of_each: { a: [input.personA.opening], b: [input.personB.opening] },
      common_ground: ["x"],
      proposed_resolution: [{ step: "x", who: "BOTH" }],
      fault_view: { stated: true, text: "x", confidence: "low" },
      caveats: [],
      safety_flag: "none",
    },
  }));

async function decidedToken() {
  const res = await createCase(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Trip", mode: "COMMON_GROUND_AND_VERDICT" }),
  }));
  const { links } = await res.json();
  const a = links.a.replace("/p/", "");
  const b = links.b.replace("/p/", "");
  // Each side says its own slot, so a swap is visible in the output.
  for (const [token, slot] of [[a, "A"], [b, "B"]] as const) {
    await putStatement(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: `I am slot ${slot}.` }),
      }),
      { params: Promise.resolve({ token, kind: "OPENING" }) },
    );
  }
  for (const token of [a, b]) {
    await lockParty(new Request(`http://localhost/api/p/${token}/lock`, { method: "POST" }), {
      params: Promise.resolve({ token }),
    });
    await judged(); // the handler answers first; the run happens behind it
  }
  return a;
}

async function decidedCase() {
  const v = (await partyView(await decidedToken()))!.verdict!;
  assert.equal(v.safety_flag, "none", "the echo judge raised no flag");
  if (v.safety_flag !== "none") throw new Error("unreachable");
  return v;
}

for (const [label, coin] of [["slot A is shown first", 0.1], ["slot B is shown first", 0.9]] as const) {
  test(`the page's A and B are the real A and B when ${label}`, async () => {
    echo();
    Math.random = () => coin;
    const v = await decidedCase();
    assert.equal(v.needs_of_each.a[0], "I am slot A.", "needs listed under A are not slot A's");
    assert.equal(v.needs_of_each.b[0], "I am slot B.", "needs listed under B are not slot B's");
    assert.equal(v.disputed_facts[0].a_says, "I am slot A.", "the quote attributed to A is not A's");
    assert.equal(v.disputed_facts[0].b_says, "I am slot B.", "the quote attributed to B is not B's");
  });
}

test("a decided link opened in a fresh tab shows the verdict, not a waiting screen", async () => {
  echo();
  const token = await decidedToken();

  // What the server hands the page on first paint. Polling stops once a case is
  // decided, so whatever is missing here is missing for good.
  const initial = await partyView(token);
  assert.ok(initial, "the token did not resolve");
  assert.equal(initial!.case.status, "DECIDED");
  assert.ok(initial!.verdict, "the page would render a waiting screen for ever");
});
