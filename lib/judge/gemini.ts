import { env } from "../env";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { JudgeResult, type JudgeInput, type JudgeProvider } from "./schema";

/**
 * The same structured answer the Bedrock provider forces through a tool call,
 * got here through Gemini's responseSchema instead: the model is given a JSON
 * mime type and this shape, and cannot reply with prose. Both providers answer
 * into the one JudgeResult, so nothing downstream knows which one ran.
 *
 * The shape is spelled out again rather than shared with bedrock.ts because
 * the two APIs disagree on the dialect: Gemini wants upper-case type names and
 * rejects minItems, Converse wants lower-case JSON Schema. A single object
 * bent to satisfy both would be harder to read than two honest ones. The Zod
 * parse below is what actually guarantees the contract in either case.
 */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary_neutral: { type: "STRING", description: "A neutral account both people would recognise." },
    agreed_facts: { type: "ARRAY", items: { type: "STRING" } },
    disputed_facts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          issue: { type: "STRING" },
          a_says: { type: "STRING", description: "What Person 1 says about this." },
          b_says: { type: "STRING", description: "What Person 2 says about this." },
        },
        required: ["issue", "a_says", "b_says"],
      },
    },
    needs_of_each: {
      type: "OBJECT",
      properties: {
        a: { type: "ARRAY", items: { type: "STRING" } },
        b: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["a", "b"],
    },
    common_ground: { type: "ARRAY", items: { type: "STRING" } },
    proposed_resolution: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          step: { type: "STRING" },
          who: { type: "STRING", enum: ["A", "B", "BOTH"] },
        },
        required: ["step", "who"],
      },
    },
    fault_view: {
      type: "OBJECT",
      properties: {
        stated: { type: "BOOLEAN" },
        text: { type: "STRING" },
        confidence: { type: "STRING", enum: ["low", "medium", "high"] },
      },
      required: ["stated", "text", "confidence"],
    },
    caveats: { type: "ARRAY", items: { type: "STRING" } },
    safety_flag: { type: "STRING", enum: ["none", "possible_abuse", "self_harm"] },
  },
  required: [
    "summary_neutral", "agreed_facts", "disputed_facts", "needs_of_each",
    "common_ground", "proposed_resolution", "fault_view", "caveats", "safety_flag",
  ],
} as const;

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

type Fetch = typeof globalThis.fetch;

/**
 * Person 1 / Person 2 are already anonymised by runJudge, so the prompt carries
 * no hint of who created the case.
 *
 * ponytail: one retry on an unparseable answer, matching the Bedrock provider.
 * If a model needs more, make the count an env var rather than a loop.
 */
export function makeGeminiJudge(opts: {
  apiKey: string;
  modelId: string;
  fetch?: Fetch;
}): JudgeProvider {
  const doFetch = opts.fetch ?? globalThis.fetch;

  return async (input: JudgeInput) => {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildUserMessage(input, input.bFirst) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
        maxOutputTokens: 4096,
      },
    });

    let lastIssue = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await doFetch(`${ENDPOINT}/${opts.modelId}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": opts.apiKey, "content-type": "application/json" },
        body,
      });

      if (!response.ok) {
        // The key and the quota are the two things that go wrong here, and both
        // are worth naming rather than retrying into.
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Gemini refused the call (HTTP ${response.status}): ${detail.slice(0, 300)}`,
        );
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };

      const candidate = payload.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text ?? "";

      // A truncated answer is invalid JSON, so say why rather than letting the
      // parse error stand in for it.
      if (candidate?.finishReason === "MAX_TOKENS") {
        lastIssue = "the answer was cut off at the token limit";
        continue;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        lastIssue = "the answer was not JSON";
        continue;
      }

      const parsed = JudgeResult.safeParse(raw);
      if (parsed.success) {
        return {
          result: parsed.data,
          model: opts.modelId,
          inputTokens: payload.usageMetadata?.promptTokenCount,
          outputTokens: payload.usageMetadata?.candidatesTokenCount,
        };
      }
      lastIssue = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    }

    throw new Error(`The mediator did not come back in the right shape: ${lastIssue}`);
  };
}

export const geminiJudge: JudgeProvider = (input) => {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  return makeGeminiJudge({
    apiKey: env.GEMINI_API_KEY,
    modelId: env.GEMINI_MODEL_ID,
  })(input);
};
