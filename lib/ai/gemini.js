import { GoogleGenerativeAI } from "@google/generative-ai";

const generationConfig = { maxOutputTokens: 1024 };

function createGeminiModel() {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API key not set. Add GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) to your .env file."
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel(
    { model: "gemini-1.5-flash-latest" },
    { apiVersion: "v1beta" }
  );
}

/**
 * Generate text content from a prompt using Gemini
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateText(prompt) {
  const model = createGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  });
  const response = result.response;
  return response.text();
}

/**
 * Generate structured JSON from a prompt using Gemini
 * Automatically strips markdown code fences if present
 * @param {string} prompt
 * @returns {Promise<object>}
 */
export async function generateJSON(prompt) {
  const text = await generateText(prompt);
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  const start = text.search(/[{[]/);
  if (start === -1) throw new SyntaxError("No JSON object or array found in response");
  const trimmed = text.slice(start);
  const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (end === -1) throw new SyntaxError("No closing brace or bracket found in response");
  return JSON.parse(trimmed.slice(0, end + 1));
}
