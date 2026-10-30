import { after } from "next/server";
import { prisma } from "../db";
import { getProvider } from "./provider";
import { JudgeResult, type JudgeInput, type JudgeSide } from "./schema";

const sideOf = (statements: { kind: string; body: string; links: string[] }[]): JudgeSide => {
  const by = (kind: string) => statements.find((s) => s.kind === kind);
  return {
    opening: by("OPENING")?.body ?? "",
    context: by("CONTEXT")?.body ?? "",
    proposal: by("PROPOSAL")?.body ?? "",
    evidence: by("EVIDENCE")?.body ?? "",
    links: by("EVIDENCE")?.links ?? [],
  };
};

/**
 * Runs the mediator once for a case that has already been flipped to JUDGING.
 * The caller must have won that flip, so this never runs twice for one case.
 * On any failure the case goes to FAILED and can be retried by either party.
 */
export async function runJudge(caseId: string): Promise<void> {
  try {
    const c = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: { parties: { include: { statements: true } } },
    });

    const a = c.parties.find((p) => p.slot === "A");
    const b = c.parties.find((p) => p.slot === "B");
    if (!a || !b) throw new Error(`Case ${caseId} does not have two parties`);

    // The accounts are shown in a random order, so the creator never reads first
    // by default. The labels stay tied to the real slot, so the mediator's "A"
    // is always this case's A and nothing downstream has to be un-swapped.
    const bFirst = Math.random() < 0.5;

    const input: JudgeInput = {
      mode: c.mode,
      title: c.title,
      personA: sideOf(a.statements),
      personB: sideOf(b.statements),
      bFirst,
    };

    const provider = await getProvider();
    const { result, model, inputTokens, outputTokens } = await provider(input);
    const validated = JudgeResult.parse(result);

    await prisma.$transaction([
      prisma.verdict.create({
        data: {
          caseId,
          json: { ...validated, assignment: { first: bFirst ? "B" : "A", second: bFirst ? "A" : "B" } },
          model,
          inputTokens,
          outputTokens,
        },
      }),
      prisma.case.update({ where: { id: caseId }, data: { status: "DECIDED" } }),
    ]);
  } catch (err) {
    console.error(`judge failed for case ${caseId}:`, err);
    await prisma.case.update({ where: { id: caseId }, data: { status: "FAILED" } });
  }
}

/**
 * Flips COLLECTING to JUDGING only if both parties are locked, and only once:
 * the conditional update means exactly one concurrent caller wins.
 * Returns true if this caller should run the judge.
 */
export async function claimJudging(caseId: string): Promise<boolean> {
  const unlocked = await prisma.party.count({ where: { caseId, lockedAt: null } });
  if (unlocked > 0) return false;

  const { count } = await prisma.case.updateMany({
    where: { id: caseId, status: "COLLECTING" },
    data: { status: "JUDGING" },
  });
  return count === 1;
}

/**
 * Tests call the route handlers directly, with no request scope for `after` to
 * attach to, so they swap the scheduler the way they already swap the provider.
 */
let scheduler: ((caseId: string) => void) | null = null;
export const setScheduler = (fn: (caseId: string) => void) => { scheduler = fn; };
export const resetScheduler = () => { scheduler = null; };

/**
 * Hands the run to Next's `after`, which fires once the response has been sent
 * and keeps the serverless invocation alive while it works. Locking used to
 * await the model inside the request, so the second person to lock watched a
 * "Locking…" button for however long the mediator took.
 */
export function scheduleJudge(caseId: string): void {
  if (scheduler) return scheduler(caseId);
  after(() => runJudge(caseId));
}
