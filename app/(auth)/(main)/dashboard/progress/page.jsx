import { getProgressStats } from "@/actions/progress";
import ProgressDashboard from "./_components/progress-dashboard";

export const metadata = { title: "Progress | CraftedPath" };

export default async function ProgressPage() {
  const stats = await getProgressStats();
  return (
    <div className="max-w-5xl mx-auto">
      <ProgressDashboard stats={stats} />
    </div>
  );
}
