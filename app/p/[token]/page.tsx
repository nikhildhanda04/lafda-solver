import { notFound } from "next/navigation";
import { partyView } from "@/lib/party";
import PartyForm from "./PartyForm";

// Per-token private data: never prerendered, never cached.
export const instant = false;

export default async function PartyPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const initial = await partyView(token);
  if (!initial) notFound();

  return <PartyForm token={token} initial={initial} />;
}
