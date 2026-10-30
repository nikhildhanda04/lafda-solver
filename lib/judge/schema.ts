import { z } from "zod";

/** The mediator's structured answer. Validated on every judge run. */
export const JudgeResult = z.object({
  summary_neutral: z.string().min(1),
  agreed_facts: z.array(z.string()),
  disputed_facts: z.array(
    z.object({ issue: z.string(), a_says: z.string(), b_says: z.string() }),
  ),
  needs_of_each: z.object({ a: z.array(z.string()), b: z.array(z.string()) }),
  common_ground: z.array(z.string()),
  // The minimum useful outcome: a resolution always comes back.
  proposed_resolution: z
    .array(z.object({ step: z.string(), who: z.enum(["A", "B", "BOTH"]) }))
    .min(1),
  fault_view: z.object({
    stated: z.boolean(),
    text: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
  }),
  caveats: z.array(z.string()),
  safety_flag: z.enum(["none", "possible_abuse", "self_harm"]),
});

export type JudgeResult = z.infer<typeof JudgeResult>;

/** What the provider is given. Sides are anonymised to Person A / Person B. */
export type JudgeSide = {
  opening: string;
  context: string;
  proposal: string;
  evidence: string;
  links: string[];
};

export type JudgeInput = {
  mode: "COMMON_GROUND" | "COMMON_GROUND_AND_VERDICT";
  title: string;
  personA: JudgeSide;
  personB: JudgeSide;
  /** Show B's account first. Reading order only; the labels stay true to the slot. */
  bFirst?: boolean;
};

export type JudgeProvider = (input: JudgeInput) => Promise<{
  result: JudgeResult;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}>;
