"use client";

import { deleteCoverLetter } from "@/actions/cover-letter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import {
  Building2,
  CalendarDays,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold">No cover letters yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Generate your first AI-powered cover letter tailored to any job
          description in seconds.
        </p>
      </div>
      <Link href="/ai-cover-letter/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create your first letter
        </Button>
      </Link>
    </div>
  );
}

function LetterCard({ letter, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(letter.id);
    } finally {
      setDeleting(false);
    }
  };

  const createdAt = new Date(letter.createdAt);

  return (
    <Card className="group flex flex-col border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
              {letter.jobTitle ?? "Unknown Role"}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                <Building2 className="h-3 w-3" />
                {letter.companyName ?? "Unknown Company"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {letter.jobDescription ?? "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span title={format(createdAt, "PPPp")}>
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this cover letter?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your cover letter for{" "}
                  <span className="font-medium text-foreground">
                    {letter.jobTitle}
                  </span>{" "}
                  at{" "}
                  <span className="font-medium text-foreground">
                    {letter.companyName}
                  </span>
                  . This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function CoverLetterList({ coverLetters }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted.");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter");
    }
  };

  if (!coverLetters?.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {coverLetters.map((letter) => (
        <LetterCard key={letter.id} letter={letter} onDelete={handleDelete} />
      ))}
    </div>
  );
}
