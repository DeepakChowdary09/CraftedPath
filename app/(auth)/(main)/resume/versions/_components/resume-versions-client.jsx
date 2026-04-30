"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveResumeVersion, setActiveResumeVersion, deleteResumeVersion } from "@/actions/resume-version";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, CheckCircle2, FileText, Star } from "lucide-react";
import { format } from "date-fns";

export default function ResumeVersionsClient({ initialVersions }) {
  const router = useRouter();
  const [versions, setVersions] = useState(initialVersions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tag: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    try {
      const created = await saveResumeVersion(form);
      setVersions((prev) => [created, ...prev]);
      toast.success("Version saved");
      setDialogOpen(false);
      setForm({ title: "", content: "", tag: "" });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(id) {
    try {
      setVersions((prev) => prev.map((v) => ({ ...v, isActive: v.id === id })));
      await setActiveResumeVersion(id);
      toast.success("Active version updated");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteResumeVersion(deleteId);
      setVersions((prev) => prev.filter((v) => v.id !== deleteId));
      toast.success("Version deleted");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({ title: "", content: "", tag: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Save Version
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Save Resume Version</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Version Title *</Label>
                  <Input name="title" placeholder="e.g. Frontend — Oct 2025" value={form.title} onChange={handleChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Tag</Label>
                  <Input name="tag" placeholder="e.g. frontend, backend, fullstack" value={form.tag} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Resume Content (Markdown) *</Label>
                <textarea
                  name="content"
                  className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono"
                  placeholder="Paste your resume content here..."
                  value={form.content}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Version"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No resume versions saved.</p>
          <p className="text-sm mt-1">Save tailored versions for different job types.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.id} className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${v.isActive ? "border-primary/50 bg-primary/5" : "hover:bg-muted/30"} transition-colors`}>
              <div className="flex items-center gap-3 min-w-0">
                {v.isActive ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{v.title}</p>
                    {v.isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                    {v.tag && <Badge variant="outline" className="text-xs">{v.tag}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(v.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!v.isActive && (
                  <Button variant="outline" size="sm" onClick={() => handleSetActive(v.id)}>
                    <Star className="w-3.5 h-3.5 mr-1" /> Set Active
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(v.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version?</AlertDialogTitle>
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
