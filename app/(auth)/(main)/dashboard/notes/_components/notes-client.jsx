"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createNote, updateNote, deleteNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, StickyNote } from "lucide-react";
import { format } from "date-fns";

export default function NotesClient({ initialNotes }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function openAdd() {
    setEditing(null);
    setTitle("");
    setContent("");
    setDialogOpen(true);
  }

  function openEdit(note) {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      if (editing) {
        const updated = await updateNote(editing.id, { title, content });
        setNotes((prev) => prev.map((n) => (n.id === editing.id ? updated : n)));
        toast.success("Note updated");
      } else {
        const created = await createNote({ title, content });
        setNotes((prev) => [created, ...prev]);
        toast.success("Note created");
      }
      setDialogOpen(false);
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
      await deleteNote(deleteId);
      setNotes((prev) => prev.filter((n) => n.id !== deleteId));
      toast.success("Note deleted");
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
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Note" : "New Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                className="w-full min-h-[140px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="Write your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editing ? "Update" : "Create Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No notes yet.</p>
          <p className="text-sm mt-1">Click &quot;New Note&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border p-5 space-y-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate">{note.title}</h3>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(note)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(note.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, yyyy")}</p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
