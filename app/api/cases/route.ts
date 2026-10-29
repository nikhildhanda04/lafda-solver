import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readJson } from "@/lib/http";
import { hashToken, newToken } from "@/lib/tokens";

const CreateCase = z.object({
  title: z.string().trim().min(1).max(200),
  mode: z.enum(["COMMON_GROUND", "COMMON_GROUND_AND_VERDICT"]).default("COMMON_GROUND"),
});

export async function POST(req: Request) {
  const parsed = await readJson(req, CreateCase);
  if ("response" in parsed) return parsed.response;

  const tokens = { a: newToken(), b: newToken() };

  const created = await prisma.case.create({
    data: {
      title: parsed.data.title,
      mode: parsed.data.mode,
      parties: {
        create: [
          { slot: "A", tokenHash: hashToken(tokens.a) },
          { slot: "B", tokenHash: hashToken(tokens.b) },
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
