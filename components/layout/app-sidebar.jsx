"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bookmark,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LineChart,
  PenBox,
  StickyNote,
  Target,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Industry Insights", icon: LayoutDashboard },
      { href: "/dashboard/skills", label: "Skill Gap", icon: CheckCircle2 },
      { href: "/dashboard/progress", label: "Progress", icon: LineChart },
    ],
  },
  {
    label: "Career Tool",
    items: [
      { href: "/resume", label: "Resume Builder", icon: FileText },
      { href: "/resume/versions", label: "Resume Versions", icon: Layers },
      { href: "/ai-cover-letter", label: "Cover Letter", icon: PenBox },
      { href: "/job-tracker", label: "Job Tracker", icon: Briefcase },
    ],
  },
  {
    label: "Interview",
    items: [
      { href: "/interview", label: "Interview Prep", icon: GraduationCap },
      { href: "/interview/questions", label: "Question Bank", icon: BookOpen },
    ],
  },
  {
    label: "Personal",
    items: [
      { href: "/dashboard/goals", label: "Weekly Goals", icon: Target },
      { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
      { href: "/dashboard/bookmarks", label: "Saved Jobs", icon: Bookmark },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out shrink-0 shadow-xl",
        collapsed ? "w-[60px]" : "w-[232px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-sidebar-border gap-3 shrink-0",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0 shadow-lg">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm tracking-tight gradient-title truncate">
            CraftedPath
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 px-2 mb-1.5">
                {section.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-sidebar-border mx-1 mb-2" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0 py-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          active ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {!collapsed && active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom collapse toggle */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground/60 hover:text-muted-foreground hover:bg-sidebar-accent transition-all duration-150",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Subtle collapse toggle pill on edge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[72px] z-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-md hover:bg-accent hidden sm:flex"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
}
