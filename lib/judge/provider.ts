import type { JudgeProvider } from "./schema";
import { mockJudge } from "./mock";

let current: JudgeProvider | null = null;

/** Override the judge, for tests. */
export const setProvider = (p: JudgeProvider) => {
  current = p;
};
export const resetProvider = () => {
  current = null;
};

/**
 * Without BEDROCK_MODEL_ID there is nothing to call, so the mock answers.
 * Task 7 registers the real Bedrock provider here.
 */
export async function getProvider(): Promise<JudgeProvider> {
  if (current) return current;
  const { env } = await import("../env");
  if (!env.BEDROCK_MODEL_ID) return mockJudge;
  const { bedrockJudge } = await import("./bedrock");
  return bedrockJudge;
}
