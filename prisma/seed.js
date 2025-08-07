const { PrismaClient } = require("@prisma/client");

// Convert ES module to CommonJS
async function loadIndustries() {
  const industriesModule = await import("../data/industries.js");
  return industriesModule.industries;
}

const prisma = new PrismaClient();

async function seedIndustryInsights() {
  try {
    console.log("Seeding IndustryInsights data...");

    // Load industries data
    const industries = await loadIndustries();

    // Prepare the data for seeding
    const industryInsightsData = industries.map((industry) => ({
      industry: industry.name,
      salaryRanges: [],
      growthRate: 0,
      demandLevel: "Medium",
      topSkills: [],
      marketOutlook: "Neutral",
      keyTrends: [],
      recommendedSkills: [],
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next update in 7 days
    }));

    // Insert the data into the database
    for (const data of industryInsightsData) {
      await prisma.industryInsights.upsert({
        where: { industry: data.industry },
        update: {},
        create: data,
      });
    }

    console.log("Successfully seeded IndustryInsights data!");
  } catch (error) {
    console.error("Error seeding IndustryInsights data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedIndustryInsights();
