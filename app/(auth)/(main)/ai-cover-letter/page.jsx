import { getCoverLetters } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-4">
        🚧 Under Construction
      </h1>
      <p className="text-muted-foreground text-lg">
        The Cover Letters feature is still being built. Please imagine a team of
        over-caffeinated developers working on it ☕🤓.
      </p>
    </div>
  );
}
