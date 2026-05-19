import { getAgentRuns } from "@/actions/agent";
import AgentTimeline from "./_components/agent-timeline";

export const metadata = { title: "Agent History | CraftedPath" };

export default async function AgentHistoryPage() {
  const runs = await getAgentRuns({ limit: 20 });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent History</h1>
        <p className="text-sm text-muted-foreground">
          Every AI agent action is logged here with full reasoning traces.
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          <p className="text-lg font-medium">No agent runs yet.</p>
          <p className="text-sm mt-1">
            Agent activity will appear here once you use AI features like the JD
            Analyzer, Resume Tailor, or Interview Coach.
          </p>
        </div>
      ) : (
        <AgentTimeline runs={runs} />
      )}
    </div>
  );
}
