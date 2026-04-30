import { generateJSON } from "@/lib/ai/gemini";
import { db } from "@/lib/prisma";
import { inngest } from "./client";

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights", id: "generate-industry-insights" },
  { cron: "0 0 * * 0" },
  async ({ event, step }) => {
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsights.findMany({
        select: { industry: true },
      });
    });

    for (const { industry } of industries) {
      try {
        const prompt = `Return ONLY valid JSON for the ${industry} industry. No extra text.
{"salaryRanges":[{"role":"string","min":0,"max":0,"median":0,"location":"string"}],"growthRate":0,"demandLevel":"High","topSkills":["skill"],"marketOutlook":"Positive","keyTrends":["trend"],"recommendedSkills":["skill"]}
Rules: 5 roles in salaryRanges, growthRate is a number, 5 items each in topSkills/keyTrends/recommendedSkills, demandLevel one of High/Medium/Low, marketOutlook one of Positive/Neutral/Negative.`;

        const insights = await step.run(
          `Generate insights for ${industry}`,
          async () => generateJSON(prompt)
        );

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
      } catch (industryError) {
        console.error(`Failed to process industry ${industry}:`, industryError.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
);
