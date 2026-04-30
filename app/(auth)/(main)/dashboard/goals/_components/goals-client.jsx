"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGoal, updateGoalProgress, deleteGoal } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Target, CheckCircle2, Minus } from "lucide-react";

export default function GoalsClient({ initialGoals }) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(7);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || target < 1) return;
    setLoading(true);
    try {
      const goal = await createGoal({ title, target: Number(target) });
      setGoals((prev) => [goal, ...prev]);
      toast.success("Goal created");
      setDialogOpen(false);
      setTitle("");
      setTarget(7);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProgress(id, delta) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const newProgress = Math.min(Math.max(goal.progress + delta, 0), goal.target);
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, progress: newProgress, isCompleted: newProgress >= g.target } : g));
    try {
      await updateGoalProgress(id, newProgress);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
      setGoals((prev) => prev.map((g) => g.id === id ? goal : g));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteGoal(deleteId);
      setGoals((prev) => prev.filter((g) => g.id !== deleteId));
      toast.success("Goal deleted");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  }

  const completed = goals.filter((g) => g.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completed}/{goals.length} goals completed this week
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setTitle(""); setTarget(7); }}>
              <Plus className="w-4 h-4 mr-2" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Weekly Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Goal Title</Label>
                <Input placeholder="e.g. Apply to 5 jobs" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Target (count)</Label>
                <Input type="number" min={1} max={100} value={target} onChange={(e) => setTarget(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Goal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No goals yet.</p>
          <p className="text-sm mt-1">Set your first weekly goal to stay on track.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.round((goal.progress / goal.target) * 100);
            return (
              <div key={goal.id} className={`rounded-xl border p-5 space-y-3 ${goal.isCompleted ? "border-green-500/40 bg-green-50/30 dark:bg-green-950/20" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {goal.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <Target className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium">{goal.title}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(goal.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{goal.progress} / {goal.target} — {pct}%</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleProgress(goal.id, -1)} disabled={goal.progress <= 0}>
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleProgress(goal.id, 1)} disabled={goal.isCompleted}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
