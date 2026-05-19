import CoverLetterAgentForm from "./_components/cover-letter-agent-form";

export const metadata = { title: "Cover Letter Agent | CraftedPath" };

export default function CoverLetterAgentPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Cover Letter Agent</h1>
        <p className="text-sm text-muted-foreground">
          The agent drafts a cover letter, self-critiques it, revises based on
          feedback, and scores the final result — all autonomously.
        </p>
      </div>
      <CoverLetterAgentForm />
    </div>
  );
}
