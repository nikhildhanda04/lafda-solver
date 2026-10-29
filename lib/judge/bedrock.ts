import type { JudgeProvider } from "./schema";

// TODO (Task 7): the real Bedrock Converse call. Until then a configured
// BEDROCK_MODEL_ID fails loudly rather than silently falling back to the mock.
export const bedrockJudge: JudgeProvider = async () => {
  throw new Error("The Bedrock judge is not wired up yet (Task 7).");
};
