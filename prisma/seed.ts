import { prisma } from "../lib/db";
import { hashToken } from "../lib/tokens";

// Fixed tokens so the sample case has stable links across reseeds. Dev only.
const SAMPLE = {
  A: { token: "sample-token-a", displayName: "Aarav" },
  B: { token: "sample-token-b", displayName: "Bela" },
};

const statements = {
  A: [
    { kind: "OPENING" as const, body: "I planned the weekend trip for weeks and she cancelled the night before." },
    { kind: "CONTEXT" as const, body: "I booked the cabin on the 3rd and told her that evening. On the 14th she said her sister needed her. I had already paid the non-refundable deposit." },
    { kind: "PROPOSAL" as const, body: "She covers half the deposit and we rebook within a month, with the date agreed in writing." },
    { kind: "EVIDENCE" as const, body: "Booking confirmation and the message where I told her the date.", links: ["https://example.com/booking-confirmation", "https://example.com/chat-14th"] },
  ],
  B: [
    { kind: "OPENING" as const, body: "My sister had a medical emergency and he is treating it like I broke a contract." },
    { kind: "CONTEXT" as const, body: "He mentioned a cabin in passing but never confirmed a date with me. On the 14th my sister was admitted to hospital and I left that night." },
    { kind: "PROPOSAL" as const, body: "We split the deposit loss evenly and agree that trips get confirmed together before anything is paid." },
    { kind: "EVIDENCE" as const, body: "Hospital discharge summary dated the 15th.", links: ["https://example.com/discharge-summary"] },
  ],
};

async function main() {
  await prisma.case.deleteMany();

  const c = await prisma.case.create({
    data: {
      title: "Cancelled weekend trip",
      mode: "COMMON_GROUND_AND_VERDICT",
      parties: {
        create: (["A", "B"] as const).map((slot) => ({
          slot,
          displayName: SAMPLE[slot].displayName,
          tokenHash: hashToken(SAMPLE[slot].token),
          statements: { create: statements[slot] },
        })),
      },
    },
  });

  console.log(`Seeded case ${c.id}`);
  for (const slot of ["A", "B"] as const) console.log(`  ${slot}: /p/${SAMPLE[slot].token}`);
}

main().finally(() => prisma.$disconnect());
