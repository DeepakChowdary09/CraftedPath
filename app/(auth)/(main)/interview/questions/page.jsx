import { getQuestions, getPracticedQuestionIds, getQuestionFilters } from "@/actions/questions";
import QuestionsClient from "./_components/questions-client";

export const metadata = { title: "Question Bank | CraftedPath" };

export default async function QuestionsPage() {
  const [questions, practicedIds, filters] = await Promise.all([
    getQuestions(),
    getPracticedQuestionIds(),
    getQuestionFilters(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <QuestionsClient
        initialQuestions={questions}
        initialPracticedIds={practicedIds}
        filters={filters}
      />
    </div>
  );
}
