import { prisma } from "./db";
import { hashToken } from "./tokens";

export const KINDS = ["OPENING", "CONTEXT", "PROPOSAL", "EVIDENCE"] as const;
export type Kind = (typeof KINDS)[number];

/** Resolve a party from a raw link token. Returns null for an unknown token. */
export async function resolveParty(token: string) {
  if (!token) return null;
  return prisma.party.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { case: true, statements: true },
  });
}

export type ResolvedParty = NonNullable<Awaited<ReturnType<typeof resolveParty>>>;

/** Own statements keyed by kind: the shape the form reads on load. */
export function ownStatements(party: ResolvedParty) {
  return Object.fromEntries(
    party.statements.map((s) => [s.kind, { body: s.body, links: s.links }]),
  ) as Partial<Record<Kind, { body: string; links: string[] }>>;
}

/**
 * Everything one party may see, as the page and the polling endpoint both need
 * it. They used to build this separately and drifted: the page never loaded the
 * verdict, so a decided link opened in a fresh tab sat on "the mediator is
 * reading both accounts" for ever, because polling stops once a case is decided.
 * One builder, one answer.
 */
export async function partyView(token: string) {
  const { verdictView } = await import("./verdict");
  const party = await resolveParty(token);
  if (!party) return null;

  const decided = party.case.status === "DECIDED";

  const other = await prisma.party.findFirst({
    where: { caseId: party.caseId, NOT: { id: party.id } },
    // Their statements are loaded only once the case is decided; before that the
    // select below cannot return them at all.
    include: { statements: decided },
  });

  const verdict = decided
    ? await prisma.verdict.findUnique({ where: { caseId: party.caseId } })
    : null;

  return {
    case: {
      id: party.case.id,
      title: party.case.title,
      mode: party.case.mode,
      status: party.case.status,
    },
    you: {
      slot: party.slot,
      displayName: party.displayName,
      locked: party.lockedAt !== null,
      statements: ownStatements(party),
    },
    other: {
      displayName: other?.displayName ?? null,
      locked: other?.lockedAt != null,
      statements: decided && other ? ownStatements(other as never) : null,
    },
    verdict: verdict
      ? verdictView(verdict.json, party.case.mode, {
          A: (party.slot === "A" ? party.displayName : other?.displayName) ?? "Person A",
          B: (party.slot === "B" ? party.displayName : other?.displayName) ?? "Person B",
        })
      : null,
  };
}
