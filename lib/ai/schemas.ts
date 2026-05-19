import { z } from "zod";

export const JobMatchSchema = z.object({
  missing_keywords: z.array(z.string()),
  overemphasized_skills: z.array(z.string()),
  tone_mismatches: z.array(z.string()),
});

export type JobMatchOutput = z.infer<typeof JobMatchSchema>;

export const ATSReviewSchema = z.object({
  section_instructions: z.array(
    z.object({
      target_section: z.string(),
      instruction: z.string(),
    })
  ),
});

export type ATSReviewOutput = z.infer<typeof ATSReviewSchema>;

export interface PipelineResult {
  jobMatch: JobMatchOutput;
  atsReview: ATSReviewOutput;
  optimizedResume: string;
  coverLetter: string | null;
}
