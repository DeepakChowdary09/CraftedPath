"use client";

import { useState } from "react";
import { runInterviewSession } from "@/actions/interview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Bot,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Target,
  Info,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";

const SEVERITY_STYLE = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const DIFFICULTY_STYLE = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function AgentAnalysis({ questionResults }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runInterviewSession(questionResults);
      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Agent analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading && !error) {
    return (
      <Card className="border-dashed border-2 border-indigo-500/30 bg-indigo-500/5">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="flex items-center gap-2 text-indigo-500">
            <Bot className="h-5 w-5" />
            <span className="text-sm font-semibold">Interview Coach Agent</span>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Run the AI agent to get per-answer evaluation, identify your weak areas,
            and generate targeted follow-up questions to practice.
          </p>
          <Button onClick={handleRunAnalysis} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Run Agent Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          <p className="text-sm text-muted-foreground">
            Agent is evaluating your answers, identifying weak areas, and generating follow-ups...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex items-start gap-3 py-6">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={handleRunAnalysis} variant="outline" size="sm" className="mt-3">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreColor =
    analysis.overallScore >= 70
      ? "text-green-500"
      : analysis.overallScore >= 40
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold">Agent Analysis</h3>
        </div>
        <div className="group relative">
          <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground cursor-help">
            <Info className="h-3 w-3" />
            Powered by agent loop
          </Badge>
          <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block w-64 rounded-lg border bg-popover p-3 shadow-md text-xs text-muted-foreground">
            This analysis was produced by an autonomous AI agent that evaluated each answer individually, identified patterns across your mistakes, and generated personalized follow-up questions — all in a multi-step reasoning loop with full tool-call tracing.
          </div>
        </div>
      </div>

      {/* Overall Score + Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Agent Score</p>
              <div className="flex items-end gap-1.5">
                <span className={`text-4xl font-bold ${scoreColor}`}>
                  {analysis.overallScore}
                </span>
                <span className="text-lg text-muted-foreground mb-1">/100</span>
              </div>
              <Progress value={analysis.overallScore} className="h-2 w-40" />
            </div>
            {analysis.summary && (
              <p className="text-sm text-muted-foreground flex-1 border-l pl-6">
                {analysis.summary}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-Answer Evaluations */}
      {analysis.evaluations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Per-Answer Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {analysis.evaluations.map((ev, i) => {
                const evScoreColor =
                  ev.score >= 7 ? "text-green-500" : ev.score >= 4 ? "text-amber-500" : "text-red-500";
                return (
                  <AccordionItem
                    key={i}
                    value={`eval-${i}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left flex-1">
                        <span className={`text-lg font-bold tabular-nums ${evScoreColor}`}>
                          {ev.score}/10
                        </span>
                        <span className="text-sm line-clamp-1 flex-1">
                          {ev.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Your Answer
                          </p>
                          <p>{ev.userAnswer}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Correct Answer
                          </p>
                          <p>{ev.correctAnswer}</p>
                        </div>
                      </div>
                      {ev.feedback && (
                        <div className="text-sm rounded-lg border p-3">
                          <p className="font-medium text-xs mb-1">Feedback</p>
                          <p className="text-muted-foreground">{ev.feedback}</p>
                        </div>
                      )}
                      {ev.missedPoints?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1.5">Missed Points</p>
                          <ul className="space-y-1">
                            {ev.missedPoints.map((point, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="text-red-400 mt-0.5">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Weak Areas */}
      {analysis.weakAreas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4" />
              Weak Areas Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.weakAreas.map((area, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{area.area}</p>
                    {area.reason && (
                      <p className="text-xs text-muted-foreground">{area.reason}</p>
                    )}
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${SEVERITY_STYLE[area.severity] || SEVERITY_STYLE.medium}`}>
                    {area.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-Up Questions */}
      {analysis.followUpQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Practice These Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.followUpQuestions.map((fq, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium flex-1">{fq.question}</p>
                    <Badge className={`text-[10px] shrink-0 ${DIFFICULTY_STYLE[fq.difficulty] || ""}`}>
                      {fq.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    {fq.targetArea}
                  </div>
                  {fq.hint && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                      <span className="font-medium">Hint:</span> {fq.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Trace */}
      {analysis.toolLog?.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="trace" className="border rounded-xl px-4">
            <AccordionTrigger className="py-3 text-xs font-medium text-muted-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5" />
                Agent Trace ({analysis.toolLog.length} tool calls)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pl-2 border-l-2 border-muted ml-1 pb-2">
                {analysis.toolLog.map((step, i) => (
                  <li key={i} className="pl-4 relative">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                      <span className="text-[8px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-semibold font-mono">{step.call}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
