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

/** Own statements keyed by kind — the shape the form reads on load. */
export function ownStatements(party: ResolvedParty) {
  return Object.fromEntries(
    party.statements.map((s) => [s.kind, { body: s.body, links: s.links }]),
  ) as Partial<Record<Kind, { body: string; links: string[] }>>;
}
