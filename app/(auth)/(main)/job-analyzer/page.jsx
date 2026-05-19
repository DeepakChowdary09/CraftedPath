import JDAnalyzerForm from "./_components/jd-analyzer-form";

export const metadata = { title: "Job Analyzer | CraftedPath" };

export default function JobAnalyzerPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Description Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Paste a job description and our AI agent will extract requirements, score your
          resume match, and generate an action plan — all in one shot.
        </p>
      </div>
      <JDAnalyzerForm />
    </div>
  );
}
