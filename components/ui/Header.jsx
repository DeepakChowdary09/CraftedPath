import {
  Bookmark,
  Briefcase,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  PenBox,
  StickyNote,
  StarsIcon,
  Target,
  Layers,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Zap,
  Search,
  FileCheck,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { GuestLogoutButton } from "./guest-logout-button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getGuestSession } from "@/lib/auth/guest-session";

const GrowthToolsDropdown = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="default">
        <StarsIcon className="h-4 w-4 mr-2" />
        <span className="hidden md:block">Growth Tools</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>
        <Link href="/resume" className="flex items-center gap-2">
          <FileText className="h-4 w-4 mr-2" />
          <span>Build Resu</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/resume/versions" className="flex items-center gap-2">
          <Layers className="h-4 w-4 mr-2" />
          <span>Resume Versions</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/ai-cover-letter" className="flex items-center gap-2">
          <PenBox className="h-4 w-4 mr-2" />
          <span>Cover Letter</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/interview" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 mr-2" />
          <span>Interview Prep</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/interview/questions" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 mr-2" />
          <span>Question Bank</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/job-tracker" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 mr-2" />
          <span>Job Tracker</span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const AIAgentsDropdown = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:hover:bg-purple-900">
        <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
        <span className="hidden md:block">AI Agents</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>
        <Link href="/job-match" className="flex items-center gap-2">
          <Target className="h-4 w-4 mr-2 text-purple-500" />
          <span>Job Match</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/ats-review" className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 mr-2 text-green-500" />
          <span>ATS Review</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/resume-optimizer" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
          <span>Resume Optimizer</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/workflow" className="flex items-center gap-2">
          <Zap className="h-4 w-4 mr-2 text-yellow-500" />
          <span>Full Workflow</span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const DashboardDropdown = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        <LayoutDashboard className="h-4 w-4 mr-2" />
        <span className="hidden md:block">Dashboard</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>
        <Link href="/dashboard" className="flex items-center gap-2">
          <LineChart className="h-4 w-4 mr-2" />
          <span>Industry Insights</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/dashboard/skills" className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <span>Skill Gap</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/dashboard/progress" className="flex items-center gap-2">
          <LineChart className="h-4 w-4 mr-2" />
          <span>Progress</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/dashboard/goals" className="flex items-center gap-2">
          <Target className="h-4 w-4 mr-2" />
          <span>Weekly Goals</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/dashboard/notes" className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 mr-2" />
          <span>Notes</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/dashboard/bookmarks" className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 mr-2" />
          <span>Saved Jobs</span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
const Header = async () => {
  const session = getGuestSession();
  return (
    <header className="fixed top-0 w-full border-b border-border/40 bg-background/75 backdrop-blur-xl z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="CraftedPath Logo"
            width={200}
            height={60}
            className="h-10 py-0.5 w-auto object-contain transition-opacity group-hover:opacity-80"
            priority
          />
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <DashboardDropdown />
          <GrowthToolsDropdown />
          <AIAgentsDropdown />
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-background px-3 py-1 text-sm text-muted-foreground">
              <UserCircle className="h-4 w-4" />
              <span>{session.email}</span>
              <GuestLogoutButton />
            </div>
          ) : (
            <Button asChild variant="outline" size="sm" className="border-border/60 hover:bg-accent/50">
              <Link href="/guest">Guest Login</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
