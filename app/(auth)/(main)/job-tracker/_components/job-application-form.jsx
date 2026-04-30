"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export default function JobApplicationForm({ defaultValues, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: defaultValues?.companyName ?? "",
      position: defaultValues?.position ?? "",
      status: defaultValues?.status ?? "APPLIED",
      jobUrl: defaultValues?.jobUrl ?? "",
      notes: defaultValues?.notes ?? "",
      appliedAt: defaultValues?.appliedAt
        ? new Date(defaultValues.appliedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          placeholder="e.g. Google"
          {...register("companyName", { required: "Company name is required" })}
        />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="position">Position *</Label>
        <Input
          id="position"
          placeholder="e.g. Software Engineer"
          {...register("position", { required: "Position is required" })}
        />
        {errors.position && (
          <p className="text-xs text-destructive">{errors.position.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setValue("status", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appliedAt">Applied Date</Label>
        <Input id="appliedAt" type="date" {...register("appliedAt")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jobUrl">Job URL</Label>
        <Input
          id="jobUrl"
          type="url"
          placeholder="https://..."
          {...register("jobUrl")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          placeholder="Recruiter name, next steps, etc."
          {...register("notes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : defaultValues ? "Update Application" : "Add Application"}
      </Button>
    </form>
  );
}
