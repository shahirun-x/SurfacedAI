import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import type { LLMResult } from "./types";

const gemini = new GeminiProvider();
const groq = new GroqProvider();

export async function runWithFallback(prompt: string): Promise<LLMResult> {
  console.log(`[LLM] Requesting completion for prompt. Attempting Gemini first...`);

  let result = await gemini.complete(prompt);
  if (result.success) {
    console.log(`[LLM] Success with Gemini.`);
    return result;
  }

  console.warn(`[LLM] Gemini failed (${result.error}). Falling back to Groq...`);
  const groqResult = await groq.complete(prompt);
  if (groqResult.success) {
    console.log(`[LLM] Success with Groq fallback.`);
    return groqResult;
  }

  console.error(`[LLM] Both providers failed. Gemini Error: ${result.error}, Groq Error: ${groqResult.error}`);
  return {
    text: "",
    provider: "groq", // Returning the last attempted provider
    success: false,
    error: `All providers failed. Gemini: ${result.error} | Groq: ${groqResult.error}`,
  };
}
