import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey =
  process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Gemini API key not set. Add GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) to your .env file."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel(
  { model: "gemini-1.5-flash-latest" },
  { apiVersion: "v1beta" }
);

const generationConfig = { maxOutputTokens: 1024 };

/**
 * Generate text content from a prompt using Gemini
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateText(prompt) {
  const result = await geminiModel.generateContent({
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
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
}
