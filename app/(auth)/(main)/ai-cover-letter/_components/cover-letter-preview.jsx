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
import { Card, CardContent } from "@/components/ui/card";
import MDEditor from "@uiw/react-md-editor";
import { format } from "date-fns";
import {
  Building2,
  CalendarDays,
  CheckCheck,
  Copy,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CoverLetterPreview({ coverLetter }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const content = coverLetter?.content ?? "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = async () => {
    if (!content) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const lines = content
        .replace(/[#*_`[\]()>-]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .split("\n");

      let y = 20;
      doc.setFontSize(11);
      lines.forEach((line) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const parts = doc.splitTextToSize(line.trim(), 170);
        parts.forEach((part) => {
          doc.text(part, 20, y);
          y += 6;
        });
        if (!line.trim()) y += 3;
      });

      const filename = `cover-letter-${coverLetter.companyName ?? "download"}.pdf`
        .toLowerCase()
        .replace(/\s+/g, "-");
      doc.save(filename);
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("PDF generation failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCoverLetter(coverLetter.id);
      toast.success("Cover letter deleted.");
      router.push("/ai-cover-letter");
    } catch (err) {
      toast.error(err.message || "Failed to delete.");
      setDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* ── Main preview ── */}
      <div className="lg:col-span-3 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            AI-generated · ready to personalise before sending
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCheck className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
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
                    This will permanently delete the cover letter for{" "}
                    <span className="font-medium text-foreground">
                      {coverLetter?.jobTitle}
                    </span>{" "}
                    at{" "}
                    <span className="font-medium text-foreground">
                      {coverLetter?.companyName}
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
        </div>

        {/* Markdown preview */}
        <div
          className="rounded-lg border border-border/60 overflow-hidden"
          data-color-mode="dark"
        >
          <MDEditor
            value={content}
            preview="preview"
            height={680}
            hideToolbar
          />
        </div>
      </div>

      {/* ── Metadata sidebar ── */}
      <div className="space-y-4">
        <Card className="border-border/60 bg-muted/30">
          <CardContent className="pt-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Letter Details
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-medium truncate">
                    {coverLetter?.companyName ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Badge
                  variant="outline"
                  className="h-4 w-4 p-0 flex items-center justify-center mt-0.5 shrink-0 text-muted-foreground border-muted-foreground/40"
                >
                  J
                </Badge>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium truncate">
                    {coverLetter?.jobTitle ?? "—"}
                  </p>
                </div>
              </div>

              {coverLetter?.createdAt && (
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Generated</p>
                    <p className="text-sm font-medium">
                      {format(new Date(coverLetter.createdAt), "PPP")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {coverLetter?.jobDescription && (
              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Job Description
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-8">
                  {coverLetter.jobDescription}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}