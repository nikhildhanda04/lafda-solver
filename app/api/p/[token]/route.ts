import { NextResponse } from "next/server";
import { partyView } from "@/lib/party";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const view = await partyView(await params.then((p) => p.token));
  if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(view);
}
