import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEnv } from "../lib/env";

test("parseEnv rejects a missing DATABASE_URL", () => {
  assert.throws(() => parseEnv({}), /DATABASE_URL/);
});

test("parseEnv rejects a non-URL DATABASE_URL", () => {
  assert.throws(() => parseEnv({ DATABASE_URL: "not-a-url" }));
});

test("parseEnv accepts a DATABASE_URL alone and leaves BEDROCK_MODEL_ID undefined", () => {
  const env = parseEnv({ DATABASE_URL: "postgresql://u@localhost:5432/d" });
  assert.equal(env.DATABASE_URL, "postgresql://u@localhost:5432/d");
  assert.equal(env.BEDROCK_MODEL_ID, undefined);
  assert.equal(env.AWS_REGION, "us-east-1");
});

test("parseEnv treats an empty BEDROCK_MODEL_ID as unset", () => {
  const env = parseEnv({ DATABASE_URL: "postgresql://u@localhost:5432/d", BEDROCK_MODEL_ID: "" });
  assert.equal(env.BEDROCK_MODEL_ID, undefined);
});

test("parseEnv keeps a real BEDROCK_MODEL_ID", () => {
  const env = parseEnv({ DATABASE_URL: "postgresql://u@localhost:5432/d", BEDROCK_MODEL_ID: "some.model-id" });
  assert.equal(env.BEDROCK_MODEL_ID, "some.model-id");
});
