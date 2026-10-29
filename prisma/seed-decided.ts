/** Dev only: drives the seeded case all the way to a verdict, to look at the results screen. */
import { prisma } from "../lib/db";
import { claimJudging, runJudge } from "../lib/judge";

async function main() {
  const c = await prisma.case.findFirstOrThrow({ include: { parties: true } });
  await prisma.party.updateMany({ where: { caseId: c.id }, data: { lockedAt: new Date() } });
  await prisma.case.update({ where: { id: c.id }, data: { status: "COLLECTING" } });
  await prisma.verdict.deleteMany({ where: { caseId: c.id } });
  if (await claimJudging(c.id)) await runJudge(c.id);
  console.log((await prisma.case.findUniqueOrThrow({ where: { id: c.id } })).status);
}
main().finally(() => prisma.$disconnect());
