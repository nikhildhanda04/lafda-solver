import { z } from "zod";

const empty = (v: unknown) => (v === "" ? undefined : v);

const Env = z.object({
  DATABASE_URL: z.string().url(),
  // Unset in dev: the judge falls back to the mock provider. Confirm a real id
  // in the Bedrock console before enabling (see docs/mvp-plan.md, AI judge).
  BEDROCK_MODEL_ID: z.preprocess(empty, z.string().optional()),
  AWS_REGION: z.preprocess(empty, z.string().default("us-east-1")),
});

export type Env = z.infer<typeof Env>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const r = Env.safeParse(raw);
  if (!r.success) {
    throw new Error(
      "Invalid environment: " +
        r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "),
    );
  }
  return r.data;
}

export const env: Env = parseEnv(process.env);
