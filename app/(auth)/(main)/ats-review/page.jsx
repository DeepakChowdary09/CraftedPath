"use client";

import { useState } from "react";
import { useAgentTerminal } from "@/hooks/use-agent-stream";
import { analyzeATS } from "@/actions/agents/ats-review";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Play, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileSearch,
  Target
} from "lucide-react";
import { toast } from "sonner";

export default function ATSReviewPage() {
  const [resumeContent, setResumeContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  
  const { logs, clearLogs } = useAgentTerminal(50);

  const handleAnalyze = async () => {
    if (!resumeContent.trim()) {
      toast.error("Please enter your resume content");
      return;
    }

    setIsAnalyzing(true);
    clearLogs();

    try {
      const formData = new FormData();
      formData.append("resumeContent", resumeContent);
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription);
      }

      const response = await analyzeATS(formData);

      if (response.success) {
        setResult(response.result);
        toast.success(`ATS Analysis complete! Score: ${response.result.overallScore}/100`);
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

  const getReadinessIcon = (readiness) => {
    switch (readiness) {
      case "ready": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "needs_work": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "major_revisions": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ATS Review Agent</h1>
          <p className="text-muted-foreground">
            Analyze your resume for ATS compatibility and keyword optimization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Resume & Job Description
            </CardTitle>
            <CardDescription>
              Enter your resume and optionally a job description for keyword matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume Content *</label>
              <Textarea
                placeholder="Paste your resume content here..."
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                rows={10}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Job Description (optional)
              </label>
              <Textarea
                placeholder="Paste job description for keyword matching..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !resumeContent.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Analyze ATS Score
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
              <CardDescription>Real-time ATS analysis logs</CardDescription>
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
            <CardTitle>ATS Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="tips">Tips</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Overall Score */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <Progress 
                      value={result.overallScore} 
                      className="h-3"
                    />
                    <div className="flex items-center gap-2">
                      {getReadinessIcon(result.recruiterReadiness)}
                      <span className="capitalize">
                        {result.recruiterReadiness.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Scores */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(result.sectionScores).map(([section, score]) => (
                    <div key={section} className="p-4 bg-muted rounded-lg">
                      <div className={`text-2xl font-semibold ${getScoreColor(score)}`}>
                        {score}%
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {section.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <Progress value={score} className={`mt-2 h-1 ${getScoreBg(score)}`} />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Keywords Tab */}
              <TabsContent value="keywords">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Keyword Coverage</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.keywordAnalysis.matchedKeywords} of {result.keywordAnalysis.totalKeywords} keywords found
                      </p>
                    </div>
                    <Badge variant={result.keywordAnalysis.matchedKeywords / result.keywordAnalysis.totalKeywords > 0.7 ? "default" : "secondary"}>
                      {Math.round((result.keywordAnalysis.matchedKeywords / result.keywordAnalysis.totalKeywords) * 100)}% coverage
                    </Badge>
                  </div>

                  {result.keywordAnalysis.missingKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordAnalysis.missingKeywords.map((keyword, i) => (
                          <Badge key={i} variant="outline" className="bg-red-50 text-red-700">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-2">Matched Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordAnalysis.keywordMatches
                        .filter(k => k.found)
                        .slice(0, 20)
                        .map((match, i) => (
                          <Badge key={i} variant="outline" className="bg-green-50 text-green-700">
                            {match.keyword} ({match.occurrences}x)
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Issues Tab */}
              <TabsContent value="issues">
                {result.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p>No issues found! Your resume looks good.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.issues.map((issue, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-lg border-l-4 ${
                          issue.severity === "critical" ? "bg-red-50 border-red-500" :
                          issue.severity === "warning" ? "bg-yellow-50 border-yellow-500" :
                          "bg-blue-50 border-blue-500"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {issue.severity === "critical" ? <XCircle className="h-5 w-5 text-red-500 mt-0.5" /> :
                           issue.severity === "warning" ? <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" /> :
                           <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold capitalize">{issue.section}</span>
                              <Badge variant={
                                issue.severity === "critical" ? "destructive" :
                                issue.severity === "warning" ? "default" :
                                "secondary"
                              }>
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="mt-1">{issue.message}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Suggestion:</strong> {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tips Tab */}
              <TabsContent value="tips">
                {result.optimizationTips.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p>No optimization tips needed!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {result.optimizationTips.slice(0, 10).map((tip, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              tip.priority === "high" ? "destructive" :
                              tip.priority === "medium" ? "default" :
                              "secondary"
                            }>
                              {tip.priority} priority
                            </Badge>
                            <span className="font-semibold capitalize">{tip.section}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-red-50 p-3 rounded">
                              <div className="text-red-600 font-medium mb-1">Current:</div>
                              <div className="text-gray-700">{tip.current}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded">
                              <div className="text-green-600 font-medium mb-1">Suggested:</div>
                              <div className="text-gray-700">{tip.suggested}</div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Why:</strong> {tip.reason}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
