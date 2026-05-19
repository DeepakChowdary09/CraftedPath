"use client";

import { useState } from "react";
import { generateAgentCoverLetter } from "@/actions/cover-letter-agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  PenBox,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bot,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const SEVERITY_ICON = {
  critical: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  major: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
  minor: <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />,
};

const VERDICT_STYLE = {
  excellent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "needs-work": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  poor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const BREAKDOWN_LABELS = {
  tone: "Tone",
  relevance: "Relevance",
  keywords: "Keywords",
  structure: "Structure",
  persuasion: "Persuasion",
};

export default function CoverLetterAgentForm() {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !companyName.trim()) {
      toast.error("Job title and company name are required.");
      return;
    }
    if (jobDescription.trim().length < 30) {
      toast.error("Please provide a job description (at least 30 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateAgentCoverLetter({
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim(),
      });
      setResult(data);
      toast.success("Cover letter generated!");
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
      toast.error(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.coverLetter) return;
    navigator.clipboard.writeText(result.coverLetter);
    toast.success("Copied to clipboard!");
  };

  const scoreColor =
    result?.score >= 70
      ? "text-green-500"
      : result?.score >= 40
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenBox className="h-5 w-5 text-pink-500" />
            Job Details
          </CardTitle>
          <CardDescription>
            The agent will draft, self-critique, revise, and score your cover letter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description</label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="h-40 resize-none"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PenBox className="h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score + Verdict Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground">Quality Score</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${scoreColor}`}>
                    {result.score}
                  </span>
                  <span className="text-lg text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={result.score} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground">Verdict</p>
                <Badge className={`text-sm px-3 py-1 ${VERDICT_STYLE[result.verdict] || ""}`}>
                  {result.verdict}
                </Badge>
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <RefreshCw className="h-3 w-3" />
                  {result.iterations} revision cycle{result.iterations !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Breakdown</p>
                {Object.entries(result.breakdown || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{BREAKDOWN_LABELS[key] || key}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Cover Letter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generated Cover Letter</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg border bg-muted/30 p-5">
                {result.coverLetter}
              </div>
            </CardContent>
          </Card>

          {/* Changes Applied */}
          {result.changesApplied.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Revisions Applied ({result.changesApplied.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.changesApplied.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-xs font-bold text-pink-500">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.issue}</p>
                        <p className="text-xs text-muted-foreground">{item.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critique */}
          {result.critique.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="critique" className="border rounded-xl px-4">
                <AccordionTrigger className="py-3 text-xs font-medium text-muted-foreground hover:no-underline">
                  Self-Critique Details ({result.critique.length} items)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2">
                    {result.critique.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="mt-0.5 shrink-0">
                          {SEVERITY_ICON[item.severity] || SEVERITY_ICON.minor}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.issue}</p>
                          {item.suggestion && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.suggestion}
                            </p>
                          )}
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Agent Trace */}
          {result.toolLog && result.toolLog.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="trace" className="border rounded-xl px-4">
                <AccordionTrigger className="py-3 text-xs font-medium text-muted-foreground hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5" />
                    Agent Trace ({result.toolLog.length} tool calls)
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2 pl-2 border-l-2 border-muted ml-1 pb-2">
                    {result.toolLog.map((step, i) => (
                      <li key={i} className="pl-4 relative">
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                          <span className="text-[8px] font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs font-semibold font-mono">
                            {step.call}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
