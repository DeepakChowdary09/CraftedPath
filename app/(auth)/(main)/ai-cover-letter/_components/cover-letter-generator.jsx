"use client";

import { generateCoverLetter } from "@/actions/cover-letter";
import { coverLetterSchema } from "@/app/lib/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BrainCircuit,
  Building2,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const AI_FEATURES = [
  {
    icon: User,
    title: "Profile-Aware",
    desc: "Uses your industry, skills, and bio automatically",
  },
  {
    icon: Building2,
    title: "Company-Tailored",
    desc: "Matches tone and language to the specific company",
  },
  {
    icon: FileText,
    title: "JD-Aligned",
    desc: "Extracts key requirements from the job description",
  },
  {
    icon: BrainCircuit,
    title: "Powered by Gemini",
    desc: "Google's latest AI writes compelling, human-sounding prose",
  },
];

export default function CoverLetterGenerator() {
  const router = useRouter();
  const [descLength, setDescLength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
  });

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
    error: generateError,
  } = useFetch(generateCoverLetter);

  const jobDesc = watch("jobDescription") ?? "";
  useEffect(() => {
    setDescLength(jobDesc.length);
  }, [jobDesc]);

  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated!");
      router.push(`/ai-cover-letter/${generatedLetter.id}`);
      reset();
    }
  }, [generatedLetter]);

  const onSubmit = async (data) => {
    await generateLetterFn(data);
  };

  const handleRetry = () => handleSubmit(onSubmit)();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Main Form ── */}
      <div className="lg:col-span-2 space-y-4">
      {/* Error fallback */}
      {generateError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Generation failed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {generateError.message?.includes("401") || generateError.message?.includes("API key")
                ? "AI service unavailable — check your API key configuration."
                : generateError.message || "Something went wrong. Please try again."}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}
      <Card className="border-border/60 hover:border-indigo-500/20 transition-colors">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-xl font-semibold">Job Details</CardTitle>
          <CardDescription>
            Fill in the position details — Gemini handles the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Company Name */}
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="font-medium">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Google, Stripe, Vercel"
                  className={errors.companyName ? "border-destructive" : ""}
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-xs text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Job Title */}
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle" className="font-medium">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Frontend Engineer"
                  className={errors.jobTitle ? "border-destructive" : ""}
                  {...register("jobTitle")}
                />
                {errors.jobTitle && (
                  <p className="text-xs text-destructive">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>

              {/* Industry override */}
              <div className="space-y-1.5">
                <Label htmlFor="industry" className="font-medium">
                  Industry{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    (optional — uses your profile)
                  </span>
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g. FinTech, Healthcare AI"
                  {...register("industry")}
                />
              </div>

              {/* Experience override */}
              <div className="space-y-1.5">
                <Label htmlFor="experience" className="font-medium">
                  Years of Experience{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    (optional override)
                  </span>
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  placeholder="e.g. 4"
                  className={errors.experience ? "border-destructive" : ""}
                  {...register("experience")}
                />
                {errors.experience && (
                  <p className="text-xs text-destructive">
                    {errors.experience.message}
                  </p>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="jobDescription" className="font-medium">
                  Job Description <span className="text-destructive">*</span>
                </Label>
                <span
                  className={`text-xs tabular-nums ${
                    descLength > 4000
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {descLength.toLocaleString()} chars
                </span>
              </div>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here — the more detail, the better Gemini can tailor the letter…"
                className={`h-44 resize-none ${
                  errors.jobDescription ? "border-destructive" : ""
                }`}
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="text-xs text-destructive">
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={generating}
                size="lg"
                className="gap-2 min-w-[200px] bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>

      {/* ── Sidebar: AI Info ── */}
      <div className="space-y-4">
        <Card className="border-border/60 bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              How Gemini crafts your letter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {AI_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/60">
          <CardContent className="pt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tips for best results
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
              <li>Paste the full JD — not just bullet points</li>
              <li>Make sure your profile skills are up to date</li>
              <li>Include the exact job title as listed</li>
              <li>Add a bio in your profile for richer output</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
