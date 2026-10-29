import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { KINDS, resolveParty } from "@/lib/party";

const Body = z.object({
  body: z.string().max(4000).default(""),
  links: z.array(z.string().url()).max(5).default([]),
});

type Ctx = { params: Promise<{ token: string; kind: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { token, kind } = await params;
  if (!(KINDS as readonly string[]).includes(kind)) return bad(`Unknown step: ${kind}`);

  const parsed = await readJson(req, Body);
  if ("response" in parsed) return parsed.response;

  const party = await resolveParty(token);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (party.lockedAt) return bad("You have already locked your submission.", 409);

  const data = { body: parsed.data.body, links: parsed.data.links };
  const saved = await prisma.statement.upsert({
    where: { partyId_kind: { partyId: party.id, kind: kind as never } },
    create: { partyId: party.id, kind: kind as never, ...data },
    update: data,
  });

  return NextResponse.json({ kind: saved.kind, savedAt: new Date().toISOString() });
}
