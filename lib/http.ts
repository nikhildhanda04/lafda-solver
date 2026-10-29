import { NextResponse } from "next/server";
import { z } from "zod";

export const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Parse a JSON request body against a Zod schema. Returns a 400 Response on failure. */
export async function readJson<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: bad("Malformed JSON body") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { response: bad(parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")) };
  }
  return { data: parsed.data };
}
