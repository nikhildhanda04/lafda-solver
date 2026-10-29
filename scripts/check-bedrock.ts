/**
 * One real Bedrock call, end to end, with the credentials and model you have
 * configured. Run it before trusting a deploy: `npm run judge:check`.
 */
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../lib/env";
import { makeBedrockJudge } from "../lib/judge/bedrock";
import type { JudgeInput } from "../lib/judge/schema";

const CASE: JudgeInput = {
  mode: "COMMON_GROUND_AND_VERDICT",
  title: "The cancelled weekend trip",
  person1: {
    opening: "She cancelled the trip the night before, after I had already paid.",
    context: "I booked the cabin on the 3rd and told her that evening. On the 14th she said her sister needed her and left. The deposit was non-refundable.",
    proposal: "She covers half the deposit and we rebook within a month, with the date agreed in writing.",
    evidence: "The booking confirmation and the message where I told her the date.",
    links: [],
  },
  person2: {
    opening: "My sister had a medical emergency and he is treating it like I broke a contract.",
    context: "He mentioned a cabin in passing but never confirmed a date with me. On the 14th my sister was admitted to hospital and I left that night.",
    proposal: "We split the deposit loss evenly and agree that trips get confirmed together before anything is paid.",
    evidence: "The hospital discharge summary dated the 15th.",
    links: [],
  },
};

async function main() {
  if (!env.BEDROCK_MODEL_ID) {
    console.error("BEDROCK_MODEL_ID is not set in .env, so there is nothing to check.");
    process.exit(1);
  }

  console.log(`model:  ${env.BEDROCK_MODEL_ID}`);
  console.log(`region: ${env.AWS_REGION}`);
  console.log("calling Bedrock...\n");

  const started = Date.now();
  const judge = makeBedrockJudge({
    client: new BedrockRuntimeClient({ region: env.AWS_REGION }),
    modelId: env.BEDROCK_MODEL_ID,
  });

  try {
    const { result, inputTokens, outputTokens } = await judge(CASE);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    console.log(`OK in ${seconds}s. ${inputTokens ?? "?"} in / ${outputTokens ?? "?"} out tokens.\n`);
    console.log(`Summary: ${result.summary_neutral}\n`);
    console.log("Resolution:");
    result.proposed_resolution.forEach((s, i) => console.log(`  ${i + 1}. [${s.who}] ${s.step}`));
    console.log(`\nFault stated: ${result.fault_view.stated}` + (result.fault_view.stated ? ` (${result.fault_view.confidence})` : ""));
    console.log(`Safety flag: ${result.safety_flag}`);
    console.log("\nThe judge is wired up correctly.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`FAILED: ${message}\n`);
    if (/could not load credentials|CredentialsProviderError/i.test(message)) {
      console.error("No AWS credentials found. Create ~/.aws/credentials (see DEPLOY.md).");
    } else if (/AccessDenied|not authorized/i.test(message)) {
      console.error("Credentials work, but this principal lacks bedrock:InvokeModel on that model ARN.");
    } else if (/don't have access to the model|ValidationException.*model/i.test(message)) {
      console.error(`The model is not enabled in ${env.AWS_REGION}. Bedrock console -> Model access.`);
    } else if (/right shape/i.test(message)) {
      console.error("The model answered but not in the required shape. It may not support tool use well.");
    }
    process.exit(1);
  }
}

main();
