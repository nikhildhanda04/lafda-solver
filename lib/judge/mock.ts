import type { JudgeInput, JudgeResult } from "./schema";

const first = (s: string, fallback: string) =>
  s.trim().split(/(?<=[.!?])\s+/)[0]?.trim() || fallback;

/**
 * Stands in for the real mediator until a real provider is configured. It builds a
 * well-formed JudgeResult out of what both people actually wrote so the whole
 * flow — and the results screen — can be exercised without a model.
 */
export async function mockJudge(input: JudgeInput) {
  const pa = input.personA;
  const pb = input.personB;

  const result: JudgeResult = {
    summary_neutral: `Both accounts describe the same episode: ${input.title.toLowerCase()}. They agree on roughly what happened and disagree on what it meant and who should carry the cost.`,
    agreed_facts: [
      "Both of you describe the same event, at the same time.",
      "Both of you want this settled rather than repeated.",
    ],
    disputed_facts: [
      {
        issue: "What each of you understood had been agreed",
        a_says: first(pa.context || pa.opening, "Person A did not describe this step."),
        b_says: first(pb.context || pb.opening, "Person B did not describe this step."),
      },
    ],
    needs_of_each: {
      a: ["To be told in advance when a plan changes.", "Not to carry the cost alone."],
      b: ["To be believed about why it changed.", "To not be held to a plan they never confirmed."],
    },
    common_ground: [
      "Neither of you set out to cost the other person anything.",
      "Both of your proposals share the cost rather than put it all on one side.",
      "Both of you want the next plan confirmed properly.",
    ],
    proposed_resolution: [
      { step: first(pa.proposal, "Pay back half of what has already been spent, within two weeks."), who: "A" },
      { step: first(pb.proposal, "Put the next plan in writing before anything is paid for."), who: "B" },
      { step: "Settle the outstanding amount in one payment rather than in parts.", who: "BOTH" },
    ],
    fault_view:
      input.mode === "COMMON_GROUND_AND_VERDICT"
        ? {
            stated: false,
            text: "Neither account is clearly at fault on what is written here. One of you acted on a plan you believed was agreed; the other left for a reason most people would. What is missing is anything showing the date was actually confirmed between you.",
            confidence: "low",
          }
        : { stated: false, text: "", confidence: "low" },
    caveats: [
      "This is a stand-in mediator running without a model, so it reads both sides only shallowly.",
      "It has not seen anything behind the links either of you gave.",
    ],
    safety_flag: "none",
  };

  return { result, model: "mock", inputTokens: undefined, outputTokens: undefined };
}
