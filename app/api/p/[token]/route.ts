import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ownStatements, resolveParty } from "@/lib/party";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const party = await resolveParty(token);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const other = await prisma.party.findFirst({
    where: { caseId: party.caseId, NOT: { id: party.id } },
    // Only the fields the waiting state needs. Never the other side's statements.
    select: { displayName: true, lockedAt: true },
  });

  return NextResponse.json({
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
    },
  });
}
