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
 * Whichever real mediator is configured, else the mock.
 *
 * Gemini is checked first: both can be configured at once, and the one a
 * developer added most recently is the one they mean. Each provider is
 * imported only when it is chosen, so an unconfigured SDK is never loaded.
 */
export async function getProvider(): Promise<JudgeProvider> {
  if (current) return current;
  const { env } = await import("../env");
  if (env.GEMINI_API_KEY) {
    const { geminiJudge } = await import("./gemini");
    return geminiJudge;
  }
  if (env.BEDROCK_MODEL_ID) {
    const { bedrockJudge } = await import("./bedrock");
    return bedrockJudge;
  }
  return mockJudge;
}
