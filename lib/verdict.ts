import type { JudgeResult } from "./judge/schema";

/** A help message is shown in place of the verdict, never beside it. */
const HELP = {
  possible_abuse:
    "One of these accounts describes being threatened, controlled or hurt. This tool mediates between two people who are both free to walk away, and that is not what is being described here, so it will not hand down a resolution. Please talk to someone who can actually help: a person you trust, or a domestic abuse helpline in your country.",
  self_harm:
    "One of these accounts describes someone being at risk of hurting themselves. That matters more than this argument and it is not something a mediator should answer. Please reach out to a crisis line in your country, or to someone who can be with the person right now.",
} as const;

export type VerdictView =
  | { safety_flag: "possible_abuse" | "self_harm"; help: string }
  | (Omit<JudgeResult, "fault_view"> & {
      fault_view: JudgeResult["fault_view"] | null;
      names: { A: string; B: string };
    });

/**
 * Turns a stored verdict into what a party may see:
 * a safety flag replaces the verdict entirely, a fault view only survives in
 * verdict mode, and the Person 1 / Person 2 mapping never reaches the client.
 */
export function verdictView(
  stored: unknown,
  mode: "COMMON_GROUND" | "COMMON_GROUND_AND_VERDICT",
  names: { A: string; B: string },
): VerdictView {
  const { assignment: _assignment, ...v } = stored as JudgeResult & { assignment?: unknown };

  if (v.safety_flag !== "none") {
    return { safety_flag: v.safety_flag, help: HELP[v.safety_flag] };
  }

  return {
    ...v,
    fault_view: mode === "COMMON_GROUND_AND_VERDICT" && v.fault_view.stated ? v.fault_view : null,
    names,
  };
}
