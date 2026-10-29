import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ownStatements, resolveParty } from "@/lib/party";
import { verdictView } from "@/lib/verdict";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const party = await resolveParty(token);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
      statements: decided && other ? ownStatements(other as never) : null,
    },
    verdict: verdict
      ? verdictView(verdict.json, party.case.mode, {
          A: (party.slot === "A" ? party.displayName : other?.displayName) ?? "Person A",
          B: (party.slot === "B" ? party.displayName : other?.displayName) ?? "Person B",
        })
      : null,
  });
}
