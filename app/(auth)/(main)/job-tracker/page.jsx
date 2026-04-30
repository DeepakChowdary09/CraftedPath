import { getJobApplications, getJobStatusSummary } from "@/actions/job-application";
import JobTrackerClient from "./_components/job-tracker-client";

export const metadata = {
  title: "Job Tracker | CraftedPath",
  description: "Track your job applications in one place",
};

export default async function JobTrackerPage() {
  const [applications, summary] = await Promise.all([
    getJobApplications(),
    getJobStatusSummary(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <JobTrackerClient initialApplications={applications} summary={summary} />
    </div>
  );
}
