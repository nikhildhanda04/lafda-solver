import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runJudge } from "@/lib/judge";
import { hashToken } from "@/lib/tokens";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;

  // There are no accounts, so a party token is the only proof of access.
  let token: unknown;
  try {
    token = (await req.json())?.token;
  } catch {
    token = undefined;
  }
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "A party link is needed to retry." }, { status: 401 });
  }
  const party = await prisma.party.findFirst({
    where: { caseId: id, tokenHash: hashToken(token) },
  });
  if (!party) return NextResponse.json({ error: "A party link is needed to retry." }, { status: 401 });

  // Only a failed run is retried, and only one caller gets to retry it.
  const { count } = await prisma.case.updateMany({
    where: { id, status: "FAILED" },
    data: { status: "JUDGING" },
  });
  if (count !== 1) {
    return NextResponse.json({ error: "This case is not waiting on a failed run." }, { status: 409 });
  }

  await runJudge(id);
  const now = await prisma.case.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({ status: now.status });
}
