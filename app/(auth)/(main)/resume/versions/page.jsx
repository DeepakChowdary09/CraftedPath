import { getResumeVersions } from "@/actions/resume-version";
import ResumeVersionsClient from "./_components/resume-versions-client";

export const metadata = { title: "Resume Versions | CraftedPath" };

export default async function ResumeVersionsPage() {
  const versions = await getResumeVersions();
  return (
    <div className="max-w-5xl mx-auto">
      <ResumeVersionsClient initialVersions={versions} />
    </div>
  );
}
