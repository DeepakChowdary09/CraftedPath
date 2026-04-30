import { getSkillGap } from "@/actions/skill-gap";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata = { title: "Skill Gap | CraftedPath" };

export default async function SkillsPage() {
  const { matched, missing, userSkills } = await getSkillGap();

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {userSkills.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          <p className="text-lg font-medium">No skills found on your profile.</p>
          <p className="text-sm mt-1">Update your profile to get a skill gap analysis.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border p-6 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold">Matched Skills ({matched.length})</h2>
            </div>
            {matched.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches yet — add more skills to your profile.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {matched.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Missing Skills ({missing.length})</h2>
            </div>
            {missing.length === 0 ? (
              <p className="text-sm text-muted-foreground text-green-600">You have all required skills!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {missing.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  >
                    <XCircle className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Your Skills ({userSkills.length})</h2>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
