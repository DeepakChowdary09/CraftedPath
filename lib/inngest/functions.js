import { db } from "@/lib/prisma";
import OpenAI from "openai";
import { inngest } from "./client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights", id: "generate-industry-insights" },
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

          const res = await step.run(
            "Generate content with OpenAI",
            async () => {
              const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
              });
              return completion.choices[0].message.content;
            },
          );

          const jsonText = res;

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
          console.error(
            `Failed to process industry ${industry}:`,
            industryError,
          );
        }
      }
    } catch (error) {
      console.error("Function failed:", error);
      throw error;
    } finally {
      console.timeEnd("generateIndustryInsights total");
    }
  },
);
