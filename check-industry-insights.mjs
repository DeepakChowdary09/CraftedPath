import pkg from './lib/prisma.js';
const { db } = pkg;

async function checkIndustryInsights() {
  try {
    const insights = await db.industryInsights.findMany();
    console.log('Industry Insights records:', JSON.stringify(insights, null, 2));
    console.log('Total count:', insights.length);
  } catch (error) {
    console.error('Error fetching Industry Insights:', error);
  } finally {
    await db.$disconnect();
  }
}

