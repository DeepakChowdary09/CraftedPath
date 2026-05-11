import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { checkUser } from "@/lib/checkUser";
import GuestLoginButton from "./guest-login-button";

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
          <span>Buil Resume</span>
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
  await checkUser();
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
          <SignedIn>
            <DashboardDropdown />
            <GrowthToolsDropdown />
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-2xl border border-border/60",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>

          <SignedOut>
            <ThemeToggle />
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="border-border/60 hover:bg-accent/50">
                Sign In
              </Button>
            </SignInButton>
            <GuestLoginButton />
          </SignedOut>
        </div>
      </nav>
    </header>
  );
};

export default Header;
