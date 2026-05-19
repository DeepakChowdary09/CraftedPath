"use client";

import { useState } from "react";
import { tailorResume } from "@/actions/resume-tailor";
import { saveResume } from "@/actions/resume";
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
  XCircle,
  AlertCircle,
  Bot,
  Save,
  RefreshCw,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const SEVERITY_ICON = {
  pass: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  warning: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
  fail: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

const SEVERITY_STYLE = {
  pass: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
  fail: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
};

export default function ResumeTailorForm() {
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const data = await tailorResume(jdText);
      setResult(data);
      toast.success("Resume tailored successfully!");
    } catch (err) {
      setError(err.message || "Tailoring failed. Please try again.");
      toast.error(err.message || "Tailoring failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result?.improvedResume) return;
    setSaving(true);
    try {
      await saveResume(result.improvedResume);
      toast.success("Tailored resume saved!");
    } catch (err) {
      toast.error(err.message || "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const scoreColor =
    result?.atsScore >= 70
      ? "text-green-500"
      : result?.atsScore >= 40
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Paste Job Description
          </CardTitle>
          <CardDescription>
            The agent will extract keywords, rewrite your resume, score ATS
            match, and self-correct if below 70%.
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
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Tailoring...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Tailor Resume
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
          {/* Score Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* ATS Score */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground">ATS Score</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${scoreColor}`}>
                    {result.atsScore}
                  </span>
                  <span className="text-lg text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={result.atsScore} className="h-2" />
              </CardContent>
            </Card>

            {/* Keyword Match */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground">Keyword Match</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-indigo-500">
                    {result.keywordMatchRate}%
                  </span>
                </div>
                <Progress value={result.keywordMatchRate} className="h-2" />
              </CardContent>
            </Card>

            {/* Iterations */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground">Agent Iterations</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">
                    {result.iterations}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">
                    rewrite cycle{result.iterations !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <RefreshCw className="inline h-3 w-3 mr-1" />
                  Self-correction loop ran {result.iterations} time{result.iterations !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Changes Made */}
          {result.changes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Changes Made ({result.changes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.changes.map((change, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-500">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{change.section}</p>
                        <p className="text-xs text-muted-foreground">{change.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ATS Feedback */}
          {result.feedback.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  ATS Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.feedback.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${SEVERITY_STYLE[item.severity] || ""}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {SEVERITY_ICON[item.severity] || SEVERITY_ICON.warning}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.message}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Tailored Resume
                </>
              )}
            </Button>
          </div>

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
