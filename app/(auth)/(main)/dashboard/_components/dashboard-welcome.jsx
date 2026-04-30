"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  PenBox,
  GraduationCap,
  Briefcase,
  Target,
  ArrowRight,
  BrainCircuit,
  Mail,
  Layers,
} from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/resume", label: "Build Resume", icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  { href: "/ai-cover-letter", label: "Cover Letter", icon: PenBox, color: "text-pink-500 bg-pink-500/10" },
  { href: "/interview", label: "Interview Prep", icon: GraduationCap, color: "text-purple-500 bg-purple-500/10" },
  { href: "/job-tracker", label: "Job Tracker", icon: Briefcase, color: "text-orange-500 bg-orange-500/10" },
  { href: "/dashboard/goals", label: "Set Goals", icon: Target, color: "text-green-500 bg-green-500/10" },
  { href: "/resume/versions", label: "Resume Versions", icon: Layers, color: "text-cyan-500 bg-cyan-500/10" },
];

const STAT_CARDS = [
  { key: "assessmentCount", label: "Assessments", icon: BrainCircuit, color: "text-purple-500" },
  { key: "applicationCount", label: "Applications", icon: Briefcase, color: "text-orange-500" },
  { key: "coverLetterCount", label: "Cover Letters", icon: Mail, color: "text-pink-500" },
  { key: "resumeVersionCount", label: "Resume Versions", icon: Layers, color: "text-cyan-500" },
];

export default function DashboardWelcome({ stats }) {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  const completedGoals = stats?.completedGoalCount ?? 0;
  const totalGoals = stats?.goalCount ?? 0;
  const goalPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, <span className="gradient-title">{firstName}</span> 👋
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalGoals > 0
              ? `You've completed ${completedGoals}/${totalGoals} goals this week (${goalPct}%).`
              : "Set your first weekly goal to stay on track."}
          </p>
        </div>
        <Link href="/dashboard/progress">
          <Button variant="outline" size="sm">
            View Progress <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Activity stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{stats?.[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <div className={`rounded-xl border p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-muted/50 transition-colors`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
