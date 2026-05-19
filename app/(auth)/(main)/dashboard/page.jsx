import { getIndustryInsights } from "@/actions/dashboard";
import { getUserOnboardingStatus } from "@/actions/user";
import { getProgressStats } from "@/actions/progress";
import { getLatestWeeklyPlan } from "@/actions/weekly-plan";
import { redirect } from "next/navigation";
import DashboardView from "./_components/dashboard-view";
import DashboardWelcome from "./_components/dashboard-welcome";
import WeeklyPlanCard from "./_components/weekly-plan-card";

const IndustryInsightsPage = async () => {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const [insights, stats, weeklyPlan] = await Promise.all([
    getIndustryInsights(),
    getProgressStats(),
    getLatestWeeklyPlan(),
  ]);

  return (
    <div className="space-y-8">
      <DashboardWelcome stats={stats} />
      <WeeklyPlanCard plan={weeklyPlan} />
      <DashboardView insights={insights} />
    </div>
  );
};

export default IndustryInsightsPage;
