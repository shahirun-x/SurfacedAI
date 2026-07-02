import type { LLMProvider, LLMResult } from "../types";

export class GroqProvider implements LLMProvider {
  async complete(prompt: string): Promise<LLMResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        text: "",
        provider: "groq",
        success: false,
        error: "GROQ_API_KEY is not set in environment variables.",
      };
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || response.statusText;
        return {
          text: "",
          provider: "groq",
          success: false,
          error: `Groq API error (${response.status}): ${errorMessage}`,
        };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      return {
        text,
        provider: "groq",
        success: true,
      };
    } catch (error: any) {
      return {
        text: "",
        provider: "groq",
        success: false,
        error: `Network or parsing error: ${error.message}`,
      };
    }
  }
}
