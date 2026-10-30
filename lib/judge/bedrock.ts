import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { env } from "../env";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { JudgeResult, type JudgeInput, type JudgeProvider } from "./schema";

/**
 * The judge's answer is taken as a forced tool call rather than as prose, which
 * is how Converse does structured output for every model family on Bedrock.
 */
const TOOL = {
  toolSpec: {
    name: "record_verdict",
    description: "Record the mediation result. This is the only way to answer.",
    inputSchema: {
      json: {
        type: "object",
        properties: {
          summary_neutral: { type: "string", description: "A neutral account both people would recognise." },
          agreed_facts: { type: "array", items: { type: "string" } },
          disputed_facts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue: { type: "string" },
                a_says: { type: "string", description: "What Person 1 says about this." },
                b_says: { type: "string", description: "What Person 2 says about this." },
              },
              required: ["issue", "a_says", "b_says"],
            },
          },
          needs_of_each: {
            type: "object",
            properties: {
              a: { type: "array", items: { type: "string" } },
              b: { type: "array", items: { type: "string" } },
            },
            required: ["a", "b"],
          },
          common_ground: { type: "array", items: { type: "string" } },
          proposed_resolution: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                step: { type: "string" },
                who: { type: "string", enum: ["A", "B", "BOTH"] },
              },
              required: ["step", "who"],
            },
          },
          fault_view: {
            type: "object",
            properties: {
              stated: { type: "boolean" },
              text: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["stated", "text", "confidence"],
          },
          caveats: { type: "array", items: { type: "string" } },
          safety_flag: { type: "string", enum: ["none", "possible_abuse", "self_harm"] },
        },
        required: [
          "summary_neutral", "agreed_facts", "disputed_facts", "needs_of_each",
          "common_ground", "proposed_resolution", "fault_view", "caveats", "safety_flag",
        ],
      },
    },
  },
} as const;

type MinimalClient = { send(command: ConverseCommand): Promise<unknown> };

/**
 * Person 1 / Person 2 are already anonymised by runJudge, so the prompt carries
 * no hint of who created the case.
 *
 * ponytail: one retry on an unparseable answer, as the plan specifies. If a
 * model turns out to need more, make the count an env var rather than a loop.
 */
export function makeBedrockJudge(opts: { client: MinimalClient; modelId: string }): JudgeProvider {
  return async (input: JudgeInput) => {
    const command = () =>
      new ConverseCommand({
        modelId: opts.modelId,
        system: [{ text: SYSTEM_PROMPT }],
        messages: [{ role: "user", content: [{ text: buildUserMessage(input, input.bFirst) }] }],
        toolConfig: {
          tools: [TOOL as never],
          toolChoice: { tool: { name: TOOL.toolSpec.name } },
        },
        inferenceConfig: { maxTokens: 4096 },
      });

    let lastIssue = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = (await opts.client.send(command())) as {
        output?: { message?: { content?: { toolUse?: { name?: string; input?: unknown } }[] } };
        usage?: { inputTokens?: number; outputTokens?: number };
      };

      const call = response.output?.message?.content?.find((b) => b.toolUse)?.toolUse;
      const parsed = JudgeResult.safeParse(call?.input);
      if (parsed.success) {
        return {
          result: parsed.data,
          model: opts.modelId,
          inputTokens: response.usage?.inputTokens,
          outputTokens: response.usage?.outputTokens,
        };
      }
      lastIssue = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    }

    throw new Error(`The mediator did not come back in the right shape: ${lastIssue}`);
  };
}

export const bedrockJudge: JudgeProvider = (input) => {
  if (!env.BEDROCK_MODEL_ID) throw new Error("BEDROCK_MODEL_ID is not set.");
  return makeBedrockJudge({
    client: new BedrockRuntimeClient({ region: env.AWS_REGION }),
    modelId: env.BEDROCK_MODEL_ID,
  })(input);
};
