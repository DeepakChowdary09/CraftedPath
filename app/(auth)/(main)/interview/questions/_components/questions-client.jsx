"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { togglePracticed } from "@/actions/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const DIFFICULTY_COLORS = {
  Easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function QuestionsClient({ initialQuestions, initialPracticedIds, filters }) {
  const [questions] = useState(initialQuestions);
  const [practicedIds, setPracticedIds] = useState(new Set(initialPracticedIds));
  const [roleFilter, setRoleFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const filtered = questions.filter((q) => {
    if (roleFilter !== "all" && q.role !== roleFilter) return false;
    if (topicFilter !== "all" && q.topic !== topicFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const practicedCount = filtered.filter((q) => practicedIds.has(q.id)).length;

  function handleToggle(questionId) {
    startTransition(async () => {
      try {
        const isPracticed = await togglePracticed(questionId);
        setPracticedIds((prev) => {
          const next = new Set(prev);
          if (isPracticed) next.add(questionId);
          else next.delete(questionId);
          return next;
        });
      } catch (err) {
        toast.error(err.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {filters.roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger><SelectValue placeholder="All Topics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {filters.topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger><SelectValue placeholder="All Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {filters.difficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} questions</span>
        <span>{practicedCount} practiced</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No questions found.</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => {
            const practiced = practicedIds.has(q.id);
            const expanded = expandedId === q.id;
            return (
              <div key={q.id} className={`rounded-xl border transition-colors ${practiced ? "border-green-500/30 bg-green-50/20 dark:bg-green-950/10" : "hover:bg-muted/30"}`}>
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => handleToggle(q.id)}
                    disabled={isPending}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-500 transition-colors"
                    title={practiced ? "Mark as not practiced" : "Mark as practiced"}
                  >
                    {practiced ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{q.role}</Badge>
                      <Badge variant="outline" className="text-xs">{q.topic}</Badge>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <p className={`text-sm ${practiced ? "text-muted-foreground line-through" : ""}`}>{q.question}</p>
                    {q.answer && (
                      <button
                        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setExpandedId(expanded ? null : q.id)}
                      >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expanded ? "Hide answer" : "Show answer"}
                      </button>
                    )}
                    {expanded && q.answer && (
                      <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{q.answer}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
