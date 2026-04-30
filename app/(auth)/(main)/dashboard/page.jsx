import { getIndustryInsights } from "@/actions/dashboard";
import { getUserOnboardingStatus } from "@/actions/user";
import { getProgressStats } from "@/actions/progress";
import { redirect } from "next/navigation";
import DashboardView from "./_components/dashboard-view";
import DashboardWelcome from "./_components/dashboard-welcome";

const IndustryInsightsPage = async () => {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const [insights, stats] = await Promise.all([
    getIndustryInsights(),
    getProgressStats(),
  ]);

  return (
    <div className="space-y-8">
      <DashboardWelcome stats={stats} />
      <DashboardView insights={insights} />
    </div>
  );
};

export default IndustryInsightsPage;
