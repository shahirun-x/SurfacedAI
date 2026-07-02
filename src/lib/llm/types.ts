export interface LLMResult {
  text: string;
  provider: "gemini" | "groq";
  success: boolean;
  error?: string;
}

export interface LLMProvider {
  complete(prompt: string): Promise<LLMResult>;
}
