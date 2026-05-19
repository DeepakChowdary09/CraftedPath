import ResumeTailorForm from "./_components/resume-tailor-form";

export const metadata = { title: "Resume Tailor | CraftedPath" };

export default function ResumeTailorPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Tailor</h1>
        <p className="text-sm text-muted-foreground">
          Paste a job description and the AI agent will rewrite your resume to
          maximize ATS pass rate — with a self-scoring feedback loop.
        </p>
      </div>
      <ResumeTailorForm />
    </div>
  );
}
