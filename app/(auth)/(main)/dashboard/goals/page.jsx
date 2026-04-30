import { getGoals } from "@/actions/goals";
import GoalsClient from "./_components/goals-client";

export const metadata = { title: "Weekly Goals | CraftedPath" };

export default async function GoalsPage() {
  const goals = await getGoals();
  return (
    <div className="max-w-4xl mx-auto">
      <GoalsClient initialGoals={goals} />
    </div>
  );
}
