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

    // Neutral labels in a random order, so the creator never gets the first slot
    // by default. The mapping is stored so the results page can name people again.
    const firstIsA = Math.random() < 0.5;
    const [p1, p2] = firstIsA ? [a, b] : [b, a];

    const input: JudgeInput = {
      mode: c.mode,
      title: c.title,
      person1: sideOf(p1.statements),
      person2: sideOf(p2.statements),
    };

    const provider = await getProvider();
    const { result, model, inputTokens, outputTokens } = await provider(input);
    const validated = JudgeResult.parse(result);

    await prisma.$transaction([
      prisma.verdict.create({
        data: {
          caseId,
          json: { ...validated, assignment: { person1: p1.slot, person2: p2.slot } },
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
