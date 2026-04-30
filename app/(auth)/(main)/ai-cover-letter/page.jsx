import { getCoverLetters } from "@/actions/cover-letter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {coverLetters.length > 0 && (
            <Badge variant="secondary">{coverLetters.length}</Badge>
          )}
        </div>
        <Link href="/ai-cover-letter/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Cover Letter
          </Button>
        </Link>
      </div>

      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}
