

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PenBox,
  StarsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { checkUser } from "@/lib/checkUser";

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
          <span>Build Resume</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/ai-cvletter" className="flex items-center gap-2">
          <PenBox className="h-4 w-4 mr-2" />
          <span>Cover Letter</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/interview-prep" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 mr-2" />
          <span>Interview Preparation</span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
const Header = async () => {
  await checkUser();
  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Sensai Logo"
            width={200}
            height={60}
            className="h-12 py-1 w-auto object-contain"
            priority
          />
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="default">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span className="hidden md:block">Industry Insights</span>
              </Button>
            </Link>

            <GrowthToolsDropdown />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
};

export default Header;
