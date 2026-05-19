"use client";

import { useState, useEffect } from "react";
import { useAgentTerminal } from "@/hooks/use-agent-stream";
import { 
  optimizeResume, 
  getPendingResumeChanges, 
  approvePendingChanges,
  rejectPendingChanges 
} from "@/actions/agents/resume-optimizer";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Play, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  ThumbsUp,
  ThumbsDown,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function ResumeOptimizerPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [currentResume, setCurrentResume] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [selectedChanges, setSelectedChanges] = useState([]);
  const [activeTab, setActiveTab] = useState("input");
  
  const { logs, clearLogs } = useAgentTerminal(50);

  // Load pending changes on mount
  useEffect(() => {
    loadPendingChanges();
  }, []);

  const loadPendingChanges = async () => {
    try {
      const response = await getPendingResumeChanges();
      if (response.success) {
        setPendingChanges(response.pendingChanges || []);
      }
    } catch (error) {
      console.error("Failed to load pending changes:", error);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setActiveTab("terminal");
    clearLogs();

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      if (currentResume.trim()) {
        formData.append("currentResume", currentResume);
      }

      const response = await optimizeResume(formData);

      if (response.success) {
        setResult(response.result);
        setSelectedChanges(response.result.changes.map(c => c.id));
        setActiveTab("results");
        toast.success(`Optimization complete! ${response.result.changes.length} changes proposed.`);
        
        // Reload pending changes
        await loadPendingChanges();
      } else {
        toast.error(response.error || "Optimization failed");
      }
    } catch (error) {
      toast.error("An error occurred during optimization");
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApprove = async (pendingChangesId, changeIds = null) => {
    try {
      const formData = new FormData();
      formData.append("pendingChangesId", pendingChangesId);
      if (changeIds) {
        formData.append("approvedChangeIds", changeIds.join(","));
      }

      const response = await approvePendingChanges(formData);

      if (response.success) {
        toast.success(`${response.appliedCount} changes applied to your resume!`);
        await loadPendingChanges();
        setPendingChanges(prev => prev.filter(pc => pc.id !== pendingChangesId));
      } else {
        toast.error(response.error || "Failed to apply changes");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  const handleReject = async (pendingChangesId) => {
    try {
      const formData = new FormData();
      formData.append("pendingChangesId", pendingChangesId);

      const response = await rejectPendingChanges(formData);

      if (response.success) {
        toast.success("Changes rejected");
        await loadPendingChanges();
        setPendingChanges(prev => prev.filter(pc => pc.id !== pendingChangesId));
      } else {
        toast.error(response.error || "Failed to reject changes");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  const toggleChangeSelection = (changeId) => {
    setSelectedChanges(prev => 
      prev.includes(changeId) 
        ? prev.filter(id => id !== changeId)
        : [...prev, changeId]
    );
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case "add": return <span className="text-green-500 font-bold">+</span>;
      case "edit": return <span className="text-blue-500 font-bold">✎</span>;
      case "remove": return <span className="text-red-500 font-bold">−</span>;
      default: return <span className="text-gray-500">↻</span>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resume Optimizer Agent</h1>
          <p className="text-muted-foreground">
            AI-powered resume optimization with human approval
          </p>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingChanges.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              You have {pendingChanges.length} pending resume optimization{pendingChanges.length > 1 ? 's' : ''} awaiting your approval.
            </p>
            <div className="space-y-3">
              {pendingChanges.map((pc) => (
                <Card key={pc.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {pc.changeCount} proposed changes
                      </CardTitle>
                      <Badge variant="outline">
                        {new Date(pc.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    {pc.metadata?.atsScore && (
                      <CardDescription>
                        ATS Score: {pc.metadata.atsScore} | Match Score: {pc.metadata.matchScore}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(pc.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReject(pc.id)}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Target Job Description</CardTitle>
            <CardDescription>
              Paste the job description to optimize your resume for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Job Description"
              onTextExtracted={(text) => setJobDescription(text)}
              disabled={isOptimizing}
            />

            <FileUpload
              label="Current Resume (optional)"
              onTextExtracted={(text) => setCurrentResume(text)}
              disabled={isOptimizing}
            />

            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing || !jobDescription.trim()}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Optimize Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Terminal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Agent Terminal
              </CardTitle>
              <CardDescription>Real-time optimization logs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">
                  Waiting for agent activity... Start an optimization to see logs.
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
      {result && result.changes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proposed Changes</CardTitle>
                <CardDescription>{result.summary}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedChanges(result.changes.map(c => c.id))}
                >
                  Select All
                </Button>
                <Button 
                  onClick={() => handleApprove(result.pendingChangesId, selectedChanges)}
                  disabled={selectedChanges.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Selected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.changes.map((change) => (
                <Card key={change.id} className={`border-l-4 ${
                  selectedChanges.includes(change.id) 
                    ? "border-l-blue-500" 
                    : "border-l-gray-300"
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedChanges.includes(change.id)}
                        onCheckedChange={() => toggleChangeSelection(change.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getChangeIcon(change.changeType)}
                          <span className="font-semibold capitalize">{change.section}</span>
                          {change.subsection && (
                            <span className="text-muted-foreground">→ {change.subsection}</span>
                          )}
                          <Badge variant="outline" className="ml-auto">
                            {Math.round(change.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{change.reason}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {change.currentContent && (
                        <div className="bg-red-50 p-3 rounded">
                          <div className="text-red-600 font-medium mb-1">Current:</div>
                          <div className="text-gray-700 line-clamp-3">{change.currentContent}</div>
                        </div>
                      )}
                      <div className={`p-3 rounded ${change.currentContent ? "bg-green-50" : "bg-blue-50"}`}>
                        <div className={`font-medium mb-1 ${change.currentContent ? "text-green-600" : "text-blue-600"}`}>
                          {change.currentContent ? "Proposed:" : "Add:"}
                        </div>
                        <div className="text-gray-700 line-clamp-3">{change.proposedContent}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedChanges.length} of {result.changes.length} changes selected
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleReject(result.pendingChangesId)}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Reject All
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Guardrail Report */}
      {result?.guardrailReport && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Guardrail Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-yellow-700 whitespace-pre-wrap">
              {result.guardrailReport}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
