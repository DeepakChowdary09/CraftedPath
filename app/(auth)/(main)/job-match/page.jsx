"use client";

import { useState } from "react";
import { useAgentTerminal } from "@/hooks/use-agent-stream";
import { analyzeJobMatch, runJobApplicationWorkflowAction } from "@/actions/agents/job-match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Terminal, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function JobMatchPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("input"); // input | results | terminal
  
  const { logs, isConnected, clearLogs } = useAgentTerminal(50);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setIsAnalyzing(true);
    setActiveTab("terminal");
    clearLogs();

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      if (resumeContent.trim()) {
        formData.append("resumeContent", resumeContent);
      }

      const response = await analyzeJobMatch(formData);

      if (response.success) {
        setResult(response.result);
        setActiveTab("results");
        toast.success(`Analysis complete! Match score: ${response.result.matchScore}/100`);
      } else {
        toast.error(response.error || "Analysis failed");
      }
    } catch (error) {
      toast.error("An error occurred during analysis");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFullWorkflow = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setIsAnalyzing(true);
    setActiveTab("terminal");
    clearLogs();

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      if (resumeContent.trim()) {
        formData.append("resumeContent", resumeContent);
      }

      const response = await runJobApplicationWorkflowAction(formData);

      if (response.success) {
        // Set results from workflow
        if (response.results?.jobMatch) {
          setResult(response.results.jobMatch);
        }
        setActiveTab("results");
        toast.success("Workflow complete! Check results and any pending approvals.");
      } else {
        toast.error(response.error || "Workflow failed");
      }
    } catch (error) {
      toast.error("An error occurred during workflow");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Match Agent</h1>
          <p className="text-muted-foreground">
            AI-powered analysis of how well your resume matches a job description
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "● Live" : "○ Offline"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>
              Paste the job description you want to analyze against
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              className="resize-none"
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume Content (optional)</label>
              <Textarea
                placeholder="Paste your resume here, or leave blank to use your saved resume..."
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !jobDescription.trim()}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Analyze Match
                  </>
                )}
              </Button>
              <Button 
                onClick={handleFullWorkflow}
                disabled={isAnalyzing || !jobDescription.trim()}
                variant="outline"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Full Workflow
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal / Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Agent Terminal
              </CardTitle>
              <CardDescription>Real-time agent activity logs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">
                  Waiting for agent activity... Start an analysis to see logs.
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={log.id || i} className="mb-1">
                    <span className="text-gray-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{" "}
                    <span className="text-blue-400">[{log.agent}]</span>{" "}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(result.matchScore)}`}>
                  {result.matchScore}
                </div>
                <div className="text-sm text-muted-foreground">Match Score</div>
              </div>
              <div className="flex-1 space-y-2">
                <Progress value={result.matchScore} className={getScoreBg(result.matchScore)} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-semibold">{result.breakdown.skillsMatch}%</div>
                <div className="text-sm text-muted-foreground">Skills Match</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-semibold">{result.breakdown.experienceMatch}%</div>
                <div className="text-sm text-muted-foreground">Experience</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-semibold">{result.breakdown.educationMatch}%</div>
                <div className="text-sm text-muted-foreground">Education</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-semibold">{result.breakdown.roleFit}%</div>
                <div className="text-sm text-muted-foreground">Role Fit</div>
              </div>
            </div>

            {/* Skill Gaps */}
            {result.skillGaps.filter(g => !g.userHas).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Skill Gaps</h3>
                <div className="space-y-2">
                  {result.skillGaps
                    .filter(g => !g.userHas)
                    .map((gap, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <AlertCircle className={`h-4 w-4 ${
                          gap.importance === "critical" ? "text-red-500" :
                          gap.importance === "high" ? "text-orange-500" :
                          gap.importance === "medium" ? "text-yellow-500" :
                          "text-blue-500"
                        }`} />
                        <span className="flex-1">{gap.skill}</span>
                        <Badge variant={
                          gap.importance === "critical" ? "destructive" :
                          gap.importance === "high" ? "default" :
                          "secondary"
                        }>
                          {gap.importance}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Your Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.map((strength, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {result.recommendedActions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Recommended Actions</h3>
                <div className="space-y-2">
                  {result.recommendedActions.slice(0, 5).map((action, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 border rounded-lg">
                      <Badge variant={
                        action.priority === "high" ? "destructive" :
                        action.priority === "medium" ? "default" :
                        "secondary"
                      } className="mt-0.5">
                        {action.priority}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium">{action.action}</div>
                        <div className="text-sm text-muted-foreground">{action.estimatedImpact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
