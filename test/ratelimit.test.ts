import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/cases/route";
import { prisma } from "../lib/db";
import { allow, _reset } from "../lib/ratelimit";

const post = (ip: string) =>
  POST(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ title: "A case", mode: "COMMON_GROUND" }),
  }));

beforeEach(async () => {
  await prisma.case.deleteMany();
  _reset();
});

test("the sixth case from one address inside the window is refused", async () => {
  for (let i = 1; i <= 5; i++) {
    assert.equal((await post("203.0.113.9")).status, 201, `request ${i} should have been allowed`);
  }

  const res = await post("203.0.113.9");
  assert.equal(res.status, 429);
  assert.match((await res.json()).error, /too many/i);
  assert.equal(await prisma.case.count(), 5, "the refused request still created a case");
});

test("a different address is unaffected by someone else's limit", async () => {
  for (let i = 0; i < 5; i++) await post("203.0.113.9");
  assert.equal((await post("203.0.113.9")).status, 429);
  assert.equal((await post("198.51.100.4")).status, 201);
});

test("the window expires", () => {
  const now = { t: 0 };
  const clock = () => now.t;
  for (let i = 0; i < 5; i++) assert.equal(allow("1.2.3.4", clock), true);
  assert.equal(allow("1.2.3.4", clock), false);

  now.t = 60 * 60 * 1000 + 1;
  assert.equal(allow("1.2.3.4", clock), true, "the window never expired");
});

test("a request with no forwarded address is still counted, not waved through", async () => {
  for (let i = 0; i < 5; i++) {
    const res = await POST(new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "A case" }),
    }));
    assert.equal(res.status, 201);
  }
  const res = await POST(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "A case" }),
  }));
  assert.equal(res.status, 429);
});

test("the limit is checked before the body is validated, so bad bodies cannot drain it", async () => {
  for (let i = 0; i < 5; i++) await post("203.0.113.1");
  const res = await POST(new Request("http://localhost/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.1" },
    body: "{not json",
  }));
  assert.equal(res.status, 429, "an over-limit caller got a 400 instead of a 429");
});
