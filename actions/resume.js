"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

export async function improveWithAI({ current, type }) {
  try {
    // Input validation
    if (!current || typeof current !== 'string') {
      throw new Error("Invalid or missing 'current' parameter");
    }
    if (!type || typeof type !== 'string') {
      throw new Error("Invalid or missing 'type' parameter");
    }

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        industryInsights: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Handle missing industry field gracefully
    const userIndustry = user.industry || "general";

    const prompt = `As an expert resume writer, improve the following ${type} description for a ${userIndustry} professional.
Make it more impactful, quantifiable, and aligned with industry standards.
Current content: "${current}"

Requirements:
1. Use action verbs
2. Include metrics and results where possible
3. Highlight relevant technical skills
4. Keep it concise but detailed
5. Focus on achievements over responsibilities
6. Use industry-specific keywords

Format the response as a single paragraph without any additional text or explanations.`;

    const result = await model.generateContent(prompt);
    
    if (!result || !result.response) {
      throw new Error("Invalid AI response");
    }

    const response = result.response;
    const improvedContent = response.text();
    
    if (!improvedContent || typeof improvedContent !== 'string') {
      throw new Error("AI returned empty or invalid content");
    }

    return improvedContent.trim();

  } catch (error) {
    console.error("Error improving content:", error);
    
    // Log the full error for debugging
    console.error("Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Return appropriate error messages
    if (error.message.includes("Invalid or missing")) {
      throw new Error(error.message);
    } else if (error.message.includes("Unauthorized")) {
      throw new Error("Authentication required");
    } else if (error.message.includes("User not found")) {
      throw new Error("User profile not found");
    } else if (error.message.includes("AI service not configured")) {
      throw new Error("AI service temporarily unavailable");
    } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
      throw new Error("AI service rate limit exceeded. Please try again later.");
    } else {
      throw new Error("Failed to improve content. Please try again.");
    }
  }
}