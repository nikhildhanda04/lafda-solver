import { notFound } from "next/navigation";
import { ownStatements, resolveParty } from "@/lib/party";
import PartyForm from "./PartyForm";

// Per-token private data: never prerendered, never cached.
export const instant = false;

export default async function PartyPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const party = await resolveParty(token);
  if (!party) notFound();

  const other = party.caseId
    ? await resolveOther(party.caseId, party.id)
    : null;

  return (
    <PartyForm
      token={token}
      initial={{
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
        other: { displayName: other?.displayName ?? null, locked: other?.lockedAt != null },
      }}
    />
  );
}

async function resolveOther(caseId: string, partyId: string) {
  const { prisma } = await import("@/lib/db");
  return prisma.party.findFirst({
    where: { caseId, NOT: { id: partyId } },
    select: { displayName: true, lockedAt: true },
  });
}
