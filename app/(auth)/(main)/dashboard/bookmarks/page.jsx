import { getBookmarks } from "@/actions/bookmarks";
import BookmarksClient from "./_components/bookmarks-client";

export const metadata = { title: "Saved Jobs | CraftedPath" };

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();
  return (
    <div className="max-w-4xl mx-auto">
      <BookmarksClient initialBookmarks={bookmarks} />
    </div>
  );
}
