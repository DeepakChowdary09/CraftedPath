import { getCoverLetterById } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CoverLetterPreview from "../_components/cover-letter-preview";

export default async function CoverLetterDetailPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetterById(id);

  if (!coverLetter) notFound();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ai-cover-letter">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <p className="text-sm text-muted-foreground truncate">
          <span className="font-medium text-foreground">{coverLetter.jobTitle}</span>
          {" "}&mdash;{" "}
          {coverLetter.companyName}
        </p>
      </div>

      <CoverLetterPreview coverLetter={coverLetter} />
    </div>
  );
}
