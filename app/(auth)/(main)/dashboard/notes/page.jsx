import { getNotes } from "@/actions/notes";
import NotesClient from "./_components/notes-client";

export const metadata = { title: "Notes | CraftedPath" };

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <div className="max-w-4xl mx-auto">
      <NotesClient initialNotes={notes} />
    </div>
  );
}
