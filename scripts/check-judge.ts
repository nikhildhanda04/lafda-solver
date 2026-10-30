/**
 * One real call to whichever mediator is configured, end to end. Run it before
 * trusting a deploy: `npm run judge:check`.
 *
 * It resolves the provider the same way the app does, so what it exercises is
 * what a visitor would get, rather than a second code path that can drift.
 */
import { env } from "../lib/env";
import { getProvider } from "../lib/judge/provider";
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
  const gemini = !!env.GEMINI_API_KEY;
  const bedrock = !!env.BEDROCK_MODEL_ID;

  if (!gemini && !bedrock) {
    console.error(
      "Neither GEMINI_API_KEY nor BEDROCK_MODEL_ID is set, so the mock judge would answer\n" +
        "and there is nothing real to check.",
    );
    process.exit(1);
  }

  const name = gemini ? "gemini" : "bedrock";
  const model = gemini ? env.GEMINI_MODEL_ID : env.BEDROCK_MODEL_ID;
  console.log(`provider: ${name}` + (gemini && bedrock ? "  (Bedrock is also configured and is not being used)" : ""));
  console.log(`model:    ${model}`);
  if (!gemini) console.log(`region:   ${env.AWS_REGION}`);
  console.log("calling the mediator...\n");

  const started = Date.now();
  const judge = await getProvider();

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
    if (/HTTP 400/.test(message) && /API_KEY/i.test(message)) {
      console.error("GEMINI_API_KEY is not accepted. Check it was pasted without quotes.");
    } else if (/HTTP 429/.test(message)) {
      console.error("Rate limited or out of quota on this Gemini key.");
    } else if (/HTTP 404/.test(message)) {
      console.error(`No such Gemini model as "${env.GEMINI_MODEL_ID}". Set GEMINI_MODEL_ID to one that exists.`);
    } else if (/could not load credentials|CredentialsProviderError/i.test(message)) {
      console.error("No AWS credentials found. Set AWS_BEARER_TOKEN_BEDROCK, or create ~/.aws/credentials (see DEPLOY.md).");
    } else if (/account is currently being verified/i.test(message)) {
      console.error("The credentials and the model id are fine; AWS has not finished verifying this account yet. Nothing to fix here, run this again later.");
    } else if (/Operation not allowed/i.test(message)) {
      console.error(
        "Bedrock refused the principal. If GET /foundation-model-availability/<id> reports\n" +
          "entitlementAvailability AVAILABLE but authorizationStatus NOT_AUTHORIZED even for root,\n" +
          "it is an account-level restriction and only AWS Support can clear it.",
      );
    } else if (/AccessDenied|not authorized/i.test(message)) {
      console.error("Credentials work, but this principal lacks bedrock:InvokeModel on that model ARN.");
    } else if (/on-demand throughput isn/i.test(message)) {
      console.error("That model is inference-profile only. Use the profile id, e.g. global.amazon.nova-2-lite-v1:0.");
    } else if (/right shape/i.test(message)) {
      console.error("The model answered but not in the required shape. It may not support structured output well.");
    }
    process.exit(1);
  }
}

main();
