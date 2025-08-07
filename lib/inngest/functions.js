import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { inngest } from "./client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    response_mime_type: "application/json",
  },
});

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights",
    id: "generate-industry-insights"
  },
  { cron: "0 0 * * 0" }, // Run every Sunday at midnight
  async ({ event, step }) => {
    console.time("generateIndustryInsights total");
    try {
      console.time("fetch industries");
      const industries = await step.run("Fetch industries", async () => {
        return await db.industryInsights.findMany({
          select: { industry: true },
        });
      });
      console.timeEnd("fetch industries");

      for (const { industry } of industries) {
        try {
          console.time(`process industry ${industry}`);
          const prompt = `
            Analyze the current state of the ${industry} industry and provide insights in the following JSON format.
            The JSON object should conform to this schema:
            {
              "salaryRanges": [
                { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
              ],
              "growthRate": number,
              "demandLevel": "High" | "Medium" | "Low",
              "topSkills": ["string"],
              "marketOutlook": "Positive" | "Neutral" | "Negative",
              "keyTrends": ["string"],
              "recommendedSkills": ["string"]
            }
            
            - Include at least 5 common roles for salary ranges.
            - Growth rate should be a percentage.
            - Include at least 5 skills for topSkills and recommendedSkills.
            - Include at least 5 trends for keyTrends.
          `;

          const res = await step.run("Generate content with Gemini", async () => {
            return await model.generateContent(prompt);
          });

          const jsonText = res.response.text();

          let insights;
          try {
            insights = JSON.parse(jsonText);
          } catch (parseError) {
            console.error(`Failed to parse JSON for ${industry}:`, jsonText);
            throw new Error(`Invalid JSON response for ${industry}`);
          }

          console.time(`update industryInsights ${industry}`);
          await step.run(`Update ${industry} insights`, async () => {
            await db.industryInsights.update({
              where: { industry },
              data: {
                ...insights,
                lastUpdated: new Date(),
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          });
          console.timeEnd(`update industryInsights ${industry}`);

          console.timeEnd(`process industry ${industry}`);
        } catch (industryError) {
          console.error(`Failed to process industry ${industry}:`, industryError);
        }
      }
    } catch (error) {
      console.error("Function failed:", error);
      throw error;
    } finally {
      console.timeEnd("generateIndustryInsights total");
    }
  }
);
