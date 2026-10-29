import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { claimJudging, runJudge } from "@/lib/judge";
import { resolveParty } from "@/lib/party";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const party = await resolveParty(token);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Locking is one way and idempotent: only the first call sets the timestamp.
  if (!party.lockedAt) {
    await prisma.party.updateMany({
      where: { id: party.id, lockedAt: null },
      data: { lockedAt: new Date() },
    });
  }

  if (await claimJudging(party.caseId)) await runJudge(party.caseId);

  const now = await prisma.case.findUniqueOrThrow({ where: { id: party.caseId } });
  return NextResponse.json({ locked: true, status: now.status });
}
