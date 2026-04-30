"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addBookmark, removeBookmark } from "@/actions/bookmarks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, Bookmark, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function BookmarksClient({ initialBookmarks }) {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ jobTitle: "", company: "", jobUrl: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.jobTitle.trim() || !form.company.trim()) return;
    setLoading(true);
    try {
      const created = await addBookmark(form);
      setBookmarks((prev) => [created, ...prev]);
      toast.success("Job bookmarked");
      setDialogOpen(false);
      setForm({ jobTitle: "", company: "", jobUrl: "" });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      await removeBookmark(deleteId);
      setBookmarks((prev) => prev.filter((b) => b.id !== deleteId));
      toast.success("Bookmark removed");
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
            <Button onClick={() => setForm({ jobTitle: "", company: "", jobUrl: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Save Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bookmark a Job</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input name="jobTitle" placeholder="e.g. Frontend Engineer" value={form.jobTitle} onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label>Company *</Label>
                <Input name="company" placeholder="e.g. Stripe" value={form.company} onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label>Job URL</Label>
                <Input name="jobUrl" type="url" placeholder="https://..." value={form.jobUrl} onChange={handleChange} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Bookmark"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No bookmarks yet.</p>
          <p className="text-sm mt-1">Save jobs you want to revisit or apply to later.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bookmarks.map((b) => (
            <div key={b.id} className="rounded-xl border p-5 space-y-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">{b.company}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {b.jobUrl && (
                    <a href={b.jobUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(b.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Saved {format(new Date(b.createdAt), "MMM d, yyyy")}</p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bookmark?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
