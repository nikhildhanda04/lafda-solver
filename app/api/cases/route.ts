import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readJson } from "@/lib/http";
import { allow, callerKey } from "@/lib/ratelimit";
import { hashToken, newToken } from "@/lib/tokens";

// Optional, shown only to the two people; the mediator never receives a name.
const Name = z.string().trim().max(40).optional().transform((n) => n || null);

const CreateCase = z.object({
  title: z.string().trim().min(1).max(200),
  yourName: Name,
  theirName: Name,
  mode: z.enum(["COMMON_GROUND", "COMMON_GROUND_AND_VERDICT"]).default("COMMON_GROUND"),
});

export async function POST(req: Request) {
  // Checked before the body is read, so a flood of malformed requests cannot
  // get a cheaper answer than a well-formed one.
  if (!allow(callerKey(req))) {
    return NextResponse.json(
      { error: "Too many cases opened from here. Try again in an hour." },
      { status: 429 },
    );
  }

  const parsed = await readJson(req, CreateCase);
  if ("response" in parsed) return parsed.response;

  const tokens = { a: newToken(), b: newToken() };

  const created = await prisma.case.create({
    data: {
      title: parsed.data.title,
      mode: parsed.data.mode,
      parties: {
        create: [
          { slot: "A", tokenHash: hashToken(tokens.a), displayName: parsed.data.yourName },
          { slot: "B", tokenHash: hashToken(tokens.b), displayName: parsed.data.theirName },
        ],
      },
    },
  });

  // The raw tokens exist only in this response; the database keeps their hashes.
  return NextResponse.json(
    { caseId: created.id, links: { a: `/p/${tokens.a}`, b: `/p/${tokens.b}` } },
    { status: 201 },
  );
}
