"use client";

import { useState } from "react";
import { useAgentTerminal } from "@/hooks/use-agent-stream";
import { runJobApplicationWorkflowAction } from "@/actions/agents/job-match";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Play, 
  Terminal, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowRight,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export default function WorkflowPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [options, setOptions] = useState({
    skipResumeOptimization: false,
    autoApplyChanges: false,
    minMatchScore: 50,
    minATSScore: 60,
  });
  
  const { logs, isConnected, clearLogs } = useAgentTerminal(100);

  const handleRunWorkflow = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setIsRunning(true);
    clearLogs();
    setWorkflowResult(null);

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      if (resumeContent.trim()) {
        formData.append("resumeContent", resumeContent);
      }
      formData.append("skipOptimization", options.skipResumeOptimization.toString());
      formData.append("autoApply", options.autoApplyChanges.toString());
      formData.append("minMatchScore", options.minMatchScore.toString());
      formData.append("minATSScore", options.minATSScore.toString());

      const response = await runJobApplicationWorkflowAction(formData);

      if (response.success) {
        setWorkflowResult(response);
        
        if (response.status === "pending_approval") {
          toast.info("Workflow complete! Resume changes need your approval.");
        } else {
          toast.success("Workflow completed successfully!");
        }
      } else {
        toast.error(response.error || "Workflow failed");
      }
    } catch (error) {
      toast.error("An error occurred during workflow");
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "running": return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "skipped": return <Clock className="h-5 w-5 text-gray-400" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-50 border-green-200";
      case "running": return "bg-blue-50 border-blue-200";
      case "failed": return "bg-red-50 border-red-200";
      case "skipped": return "bg-gray-50 border-gray-200";
      default: return "bg-white border-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Job Application Workflow
          </h1>
          <p className="text-muted-foreground">
            Complete workflow: Job Match → ATS Review → Resume Optimization
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "● Live Stream" : "○ Offline"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
            <CardDescription>
              Configure how the workflow should run
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description *</label>
              <Textarea
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resume Content (optional)</label>
              <Textarea
                placeholder="Paste resume here, or leave blank to use saved resume..."
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Options</h4>
              
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="skipOptimization"
                  checked={options.skipResumeOptimization}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, skipResumeOptimization: checked }))
                  }
                />
                <label htmlFor="skipOptimization" className="text-sm cursor-pointer">
                  Skip resume optimization (analysis only)
                </label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="autoApply"
                  checked={options.autoApplyChanges}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, autoApplyChanges: checked }))
                  }
                />
                <label htmlFor="autoApply" className="text-sm cursor-pointer">
                  Auto-apply changes if scores meet thresholds
                </label>
              </div>
            </div>

            <Button 
              onClick={handleRunWorkflow} 
              disabled={isRunning || !jobDescription.trim()}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Workflow...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Pipeline Visualization */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>
              Real-time workflow progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1: Job Match */}
              <div className={`p-4 rounded-lg border ${getStepStatusColor(
                workflowResult?.steps?.[0]?.status || "pending"
              )}`}>
                <div className="flex items-center gap-3">
                  {getStepStatusIcon(workflowResult?.steps?.[0]?.status || "pending")}
                  <div className="flex-1">
                    <div className="font-semibold">1. Job Match Analysis</div>
                    <div className="text-sm text-muted-foreground">
                      Analyze resume against job description
                    </div>
                  </div>
                </div>
                {workflowResult?.results?.jobMatch && (
                  <div className="mt-3 pl-8">
                    <Badge variant={workflowResult.results.jobMatch.matchScore >= 70 ? "default" : "secondary"}>
                      Score: {workflowResult.results.jobMatch.matchScore}/100
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-gray-400 rotate-90 lg:rotate-0" />
              </div>

              {/* Step 2: ATS Review */}
              <div className={`p-4 rounded-lg border ${getStepStatusColor(
                workflowResult?.steps?.[1]?.status || "pending"
              )}`}>
                <div className="flex items-center gap-3">
                  {getStepStatusIcon(workflowResult?.steps?.[1]?.status || "pending")}
                  <div className="flex-1">
                    <div className="font-semibold">2. ATS Review</div>
                    <div className="text-sm text-muted-foreground">
                      Check ATS compatibility and keywords
                    </div>
                  </div>
                </div>
                {workflowResult?.results?.ats && (
                  <div className="mt-3 pl-8">
                    <Badge variant={workflowResult.results.ats.overallScore >= 70 ? "default" : "secondary"}>
                      Score: {workflowResult.results.ats.overallScore}/100
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-gray-400 rotate-90 lg:rotate-0" />
              </div>

              {/* Step 3: Resume Optimization */}
              <div className={`p-4 rounded-lg border ${getStepStatusColor(
                workflowResult?.steps?.[2]?.status || "pending"
              )}`}>
                <div className="flex items-center gap-3">
                  {getStepStatusIcon(workflowResult?.steps?.[2]?.status || "pending")}
                  <div className="flex-1">
                    <div className="font-semibold">3. Resume Optimization</div>
                    <div className="text-sm text-muted-foreground">
                      Propose and apply improvements
                    </div>
                  </div>
                </div>
                {workflowResult?.results?.resume && (
                  <div className="mt-3 pl-8">
                    <Badge>
                      {workflowResult.results.resume.changes.length} changes
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Summary */}
            {workflowResult && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status</span>
                  <Badge variant={
                    workflowResult.status === "completed" ? "default" :
                    workflowResult.status === "pending_approval" ? "secondary" :
                    workflowResult.status === "failed" ? "destructive" :
                    "outline"
                  }>
                    {workflowResult.status}
                  </Badge>
                </div>
                {workflowResult.durationMs && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Completed in {Math.round(workflowResult.durationMs / 1000)}s
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terminal */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Live Terminal
              </CardTitle>
              <CardDescription>Agent activity in real-time</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">
                  Start a workflow to see agent activity...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={log.id || i} className="mb-1">
                    <span className="text-gray-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{" "}
                    <span className="text-blue-400">[{log.agent}]</span>{" "}
                    {log.step && <span className="text-purple-400">[{log.step}]</span>}{" "}
                    <span className={
                      log.status === "failed" ? "text-red-400" :
                      log.status === "completed" ? "text-green-400" :
                      "text-green-400"
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {workflowResult?.pendingApprovals?.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              The workflow has completed but requires your approval before applying resume changes.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/resume-optimizer">
                  Go to Resume Optimizer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
