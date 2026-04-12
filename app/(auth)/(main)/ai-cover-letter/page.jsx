import { getCoverLetters } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-6xl font-bold gradient-title">
            My Cover Letters
          </h1>
          <Link href="/ai-cover-letter/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>
      </div>
      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}
