import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const insights = await db.industryInsights.findMany({
      select: { industry: true },
    });
    return Response.json({ 
      success: true, 
      data: insights,
      count: insights.length 
    });
  } catch (error) {
    console.error('Error fetching Industry Insights:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
