import CoverLetterGenerator from "../_components/cover-letter-generator";

export default function NewCoverLetterPage() {
  return (
    <div>
      <h1 className="text-6xl font-bold gradient-title mb-5">
        Create Cover Letter
      </h1>
      <CoverLetterGenerator />
    </div>
  );
}
