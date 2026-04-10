"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateAIInsights = async (industry) => {
  // Check API key first
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const prompt = `Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
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
Include at least 5 skills and trends.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;
    const parsedData = JSON.parse(text);
    return parsedData;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Provide specific error messages based on error type
    if (
      error.message.includes("fetch failed") ||
      error.message.includes("network")
    ) {
      throw new Error(
        "Network error: Cannot connect to AI service. Check your internet connection and firewall settings.",
      );
    } else {
      throw new Error(`AI service error: ${error.message}`);
    }
  }
};

export async function getIndustryInsights() {
  try {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("OPENAI_API_KEY not defined");

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

      industryInsight = await db.industryInsights.update({
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
