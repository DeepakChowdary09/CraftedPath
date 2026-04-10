"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

/**
 * Generate a new cover letter and save to DB
 */
export async function generateCoverLetter(data) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log("🔍 Starting cover letter generation for data:", data);

  const { userId } = await auth();
  console.log("🔑 Auth userId:", userId);
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  console.log(
    "👤 Found user:",
    user ? { id: user.id, clerkUserId: user.clerkUserId } : null,
  );
  if (!user) throw new Error("User not found");

  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    
    About the candidate:
    - Industry: ${data.industry || user.industry || "Not specified"}
    - Years of Experience: ${
      data.experience || user.experience || "Not specified"
    }
    - Skills: ${user.skills?.join(", ") || "Not specified"}
    - Professional Background: ${user.bio || "Not provided"}
    
    Job Description:
    ${data.jobDescription}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown.
  `;

  try {
    console.log("🤖 Sending prompt to AI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    console.log("🤖 AI response received");

    const content = completion.choices[0].message.content?.trim();
    console.log("📝 Extracted content length:", content ? content.length : 0);
    console.log(
      "📝 Content preview:",
      content ? content.substring(0, 100) + "..." : "No content",
    );

    if (!content) throw new Error("AI returned no cover letter content");

    console.log("💾 Attempting to save to database...");
    // Save to DB
    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        userId: user.id,
      },
    });

    console.log("✅ Cover letter saved:", coverLetter.id);
    return coverLetter;
  } catch (error) {
    console.error("❌ Error generating cover letter:", error.message);
    throw new Error(error.message || "Failed to generate cover letter");
  }
}

/**
 * Get all cover letters for the logged-in user
 */
export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const letters = await db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  console.log("📩 Letters fetched:", letters.length);
  return letters;
}

/**
 * Get a single cover letter by ID
 */
export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: { id, userId: user.id },
  });
}

/**
 * Delete a cover letter by ID
 */
export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const deleted = await db.coverLetter.delete({
    where: { id, userId: user.id },
  });

  console.log("🗑️ Deleted cover letter:", deleted.id);
  return deleted;
}
