"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

const ROUTE_MAP = {
  "/dashboard": { label: "Industry Insights", group: "Overview" },
  "/dashboard/skills": { label: "Skill Gap Analysis", group: "Overview" },
  "/dashboard/progress": { label: "Progress", group: "Overview" },
  "/dashboard/goals": { label: "Weekly Goals", group: "Personal" },
  "/dashboard/notes": { label: "Notes & Journal", group: "Personal" },
  "/dashboard/bookmarks": { label: "Saved Jobs", group: "Personal" },
  "/resume": { label: "Resume Builder", group: "Career Tools" },
  "/resume/versions": { label: "Resume Versions", group: "Career Tools" },
  "/ai-cover-letter": { label: "Cover Letter", group: "Career Tools" },
  "/interview": { label: "Interview Prep", group: "Interview" },
  "/interview/questions": { label: "Question Bank", group: "Interview" },
  "/job-tracker": { label: "Job Tracker", group: "Career Tools" },
  "/onboarding": { label: "Onboarding", group: null },
};

function getRouteInfo(pathname) {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname];
  for (const [route, info] of Object.entries(ROUTE_MAP)) {
    if (pathname.startsWith(route) && route !== "/dashboard") return info;
  }
  return { label: "CraftedPath", group: null };
}

export default function AppTopbar() {
  const pathname = usePathname();
  const { label, group } = getRouteInfo(pathname);

  return (
    <header className="h-14 border-b border-border/60 bg-background/70 backdrop-blur-xl flex items-center justify-between px-5 shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back to landing page */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border/60 transition-all duration-150 shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <div className="h-4 w-px bg-border/60 shrink-0" />
        {group && (
          <>
            <span className="text-xs text-muted-foreground/60 font-medium hidden sm:block">{group}</span>
            <span className="text-muted-foreground/40 hidden sm:block">/</span>
          </>
        )}
        <h1 className="text-sm font-semibold text-foreground truncate">{label}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7",
              userButtonPopoverCard: "shadow-2xl border border-border/60",
            },
          }}
          afterSignOutUrl="/"
        />
      </div>
    </header>
  );
}
