"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuizResult from "./quiz-result";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

export default function QuizList({ assessments }) {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Recent Quizzes</CardTitle>
              <CardDescription>Review your past quiz performance</CardDescription>
            </div>
            <Button onClick={() => router.push("/interview/mock")} size="sm">
              Start New Quiz
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!assessments || assessments.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No quizzes yet.</p>
              <p className="text-sm mt-1">Start a quiz to track your interview performance.</p>
            </div>
          )}
          <div className="space-y-4">
            {assessments?.map((assessment, i) => (
              <div
                key={assessment.id}
                className="flex items-start justify-between gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setSelectedQuiz(assessment)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Quiz {i + 1}</p>
                    {assessment.improvementTip && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{assessment.improvementTip}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(assessment.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                </div>
                <Badge variant={assessment.quizScore >= 70 ? "default" : "destructive"} className="shrink-0">
                  {assessment.quizScore.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <QuizResult
            result={selectedQuiz}
            hideStartNew
            onStartNew={() => router.push("/interview/mock")}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}