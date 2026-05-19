"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, FileText, GraduationCap, Briefcase, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AGENT_META = {
  JD_ANALYZER: { icon: FileText, label: "JD Analyzer", color: "text-blue-500" },
  RESUME_TAILOR: { icon: Sparkles, label: "Resume Tailor", color: "text-violet-500" },
  COVER_LETTER: { icon: FileText, label: "Cover Letter", color: "text-green-500" },
  ADAPTIVE_QUIZ: { icon: GraduationCap, label: "Adaptive Quiz", color: "text-amber-500" },
  INTERVIEW_COACH: { icon: GraduationCap, label: "Interview Coach", color: "text-amber-500" },
  WEEKLY_CAREER: { icon: Calendar, label: "Weekly Career", color: "text-indigo-500" },
  INDUSTRY_INSIGHTS: { icon: Briefcase, label: "Industry Insights", color: "text-teal-500" },
};

function getAgentMeta(agentType) {
  return AGENT_META[agentType] || { icon: Bot, label: agentType, color: "text-muted-foreground" };
}

export default function AgentTimeline({ runs }) {
  return (
    <div className="space-y-4">
      {runs.map((run) => {
        const meta = getAgentMeta(run.agentType);
        const Icon = meta.icon;
        const toolCalls = Array.isArray(run.toolCallLog) ? run.toolCallLog : [];

        return (
          <div
            key={run.id}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                    {run.durationMs && ` · ${(run.durationMs / 1000).toFixed(1)}s`}
                  </p>
                </div>
              </div>
              <Badge
                variant={run.status === "completed" ? "default" : "destructive"}
                className="text-[10px] capitalize"
              >
                {run.status}
              </Badge>
            </div>

            {/* Summaries */}
            <div className="grid gap-2 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Input</p>
                <p className="text-sm">{run.inputSummary}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Output</p>
                <p className="text-sm">{run.outputSummary}</p>
              </div>
            </div>

            {/* Expandable Tool Call Trace */}
            {toolCalls.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="trace" className="border-none">
                  <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
                    Tool Call Trace ({toolCalls.length} step{toolCalls.length !== 1 ? "s" : ""})
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 pl-2 border-l-2 border-muted ml-1">
                      {toolCalls.map((step, i) => (
                        <li key={i} className="pl-4 relative">
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                            <span className="text-[8px] font-bold text-muted-foreground">{i + 1}</span>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                            <p className="text-xs font-semibold font-mono">
                              {step.call}
                            </p>
                            {step.args && Object.keys(step.args).length > 0 && (
                              <pre className="text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                                args: {JSON.stringify(step.args, null, 2)}
                              </pre>
                            )}
                            {step.result && (
                              <pre className="text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                                result: {JSON.stringify(step.result, null, 2).slice(0, 500)}
                                {JSON.stringify(step.result).length > 500 && "…"}
                              </pre>
                            )}
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
      })}
    </div>
  );
}
