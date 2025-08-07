"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }

    IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
    Include at least 5 common roles for salary ranges.
    Growth rate should be a percentage.
    Include at least 5 skills and trends.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    throw new Error("Failed to generate AI insights");
  }
};

export async function getIndustryInsights() {
  try {
    if (!process.env.GEMINI_API_KEY)
      throw new Error("GEMINI_API_KEY not defined");

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");
    if (!user.industry) throw new Error("User industry not set");

    let industryInsight = await db.industryInsights.findUnique({
      where: { industry: user.industry },
    });

    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (!industryInsight) {
      const insights = await generateAIInsights(user.industry);

      industryInsight = await db.industryInsight.create({
        data: {
          industry: user.industry,
          ...insights,
          nextUpdate: oneWeekFromNow,
        },
      });

      return industryInsight;
    }

    if (industryInsight.nextUpdate.getTime() < Date.now()) {
      const insights = await generateAIInsights(user.industry);

      industryInsight = await db.industryInsight.update({
        where: { industry: user.industry },
        data: {
          ...insights,
          nextUpdate: oneWeekFromNow,
        },
      });
    }

    return industryInsight;
  } catch (error) {
    console.error("Error getting industry insights:", error);
    throw error;
  }
}
