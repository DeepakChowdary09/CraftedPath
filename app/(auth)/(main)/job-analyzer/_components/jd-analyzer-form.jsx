"use client";

import { useState } from "react";
import { analyzeJobDescription } from "@/actions/jd-analyzer";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

const SEVERITY_STYLES = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const CATEGORY_ICONS = {
  skill: "🎯",
  keyword: "🔑",
  experience: "💼",
  certification: "📜",
};

export default function JDAnalyzerForm() {
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jdText.trim() || jdText.trim().length < 50) {
      toast.error("Please paste a job description (at least 50 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeJobDescription(jdText);
      setResult(data);
      toast.success("Analysis complete!");
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    result?.matchScore >= 70
      ? "text-green-500"
      : result?.matchScore >= 40
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Paste Job Description
          </CardTitle>
          <CardDescription>
            The agent will extract requirements, match them against your resume,
            and build an action plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="h-48 resize-none"
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tabular-nums">
                {jdText.length.toLocaleString()} chars
              </span>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    Analyze JD
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
          {/* Match Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Resume Match Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-bold ${scoreColor}`}>
                  {result.matchScore}
                </span>
                <span className="text-xl text-muted-foreground mb-1">/100</span>
              </div>
              <Progress value={result.matchScore} className="h-3" />
              {result.summary && (
                <p className="text-sm text-muted-foreground mt-2">
                  {result.summary}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Gap Analysis */}
          {result.gaps.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Gap Analysis ({result.gaps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.gaps.map((gap, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{gap.skill}</p>
                        {gap.reason && (
                          <p className="text-xs text-muted-foreground">
                            {gap.reason}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-[10px] shrink-0 ${SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.medium}`}
                      >
                        {gap.severity || "medium"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Plan */}
          {result.actionPlan.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {result.actionPlan.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-500">
                        {item.priority || i + 1}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{item.action}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {CATEGORY_ICONS[item.category] || "📋"}{" "}
                            {item.category || "general"}
                          </span>
                          {item.estimatedEffort && (
                            <span>· {item.estimatedEffort}</span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Tool Call Trace */}
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
