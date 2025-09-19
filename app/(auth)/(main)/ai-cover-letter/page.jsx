export default async function CoverLetterPage() {
  // ❌ Commented out the real data fetching
  // const coverLetters = await getCoverLetters();

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

    // ❌ Original UI commented out
    // <div>
    //   <div className="flex flex-col md:flex-row gap-2 items-center justify-between mb-5">
    //     <h1 className="text-6xl font-bold gradient-title">My Cover Letters</h1>
    //     <Link href="/ai-cover-letter/new">
    //       <Button>
    //         <Plus className="h-4 w-4 mr-2" />
    //         Create New
    //       </Button>
    //     </Link>
    //   </div>
    //
    //   <CoverLetterList coverLetters={coverLetters} />
    // </div>
  );
}
