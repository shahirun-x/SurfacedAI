import type { LLMProvider, LLMResult } from "../types";

export class GeminiProvider implements LLMProvider {
  async complete(prompt: string): Promise<LLMResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        text: "",
        provider: "gemini",
        success: false,
        error: "GEMINI_API_KEY is not set in environment variables.",
      };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || response.statusText;
        return {
          text: "",
          provider: "gemini",
          success: false,
          error: `Gemini API error (${response.status}): ${errorMessage}`,
        };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        text,
        provider: "gemini",
        success: true,
      };
    } catch (error: any) {
      return {
        text: "",
        provider: "gemini",
        success: false,
        error: `Network or parsing error: ${error.message}`,
      };
    }
  }
}
