import Link from "next/link";

import { GuestLoginCard } from "@/components/ui/guest-login-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata = {
  title: "Guest Login | CraftedPath",
};

export default function GuestLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          CraftedPath
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-16">
        <div className="mx-auto flex w-full flex-col items-center space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Explore CraftedPath instantly</h1>
            <p className="text-muted-foreground max-w-xl">
              Use the shared guest credentials provided by the CraftedPath team to explore dashboards,
              AI agents, and workflows without creating an account.
            </p>
          </div>
          <GuestLoginCard />
          <div className="max-w-md rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Development tip</p>
            <p>
              If you see a “Slow filesystem detected” warning, it usually means the project lives on a network
              or synced drive. Move the repository (or at least the <code>.next</code> folder) onto a fast local disk
              like <code>C:\Users\you\Projects</code> to speed up Turbopack builds.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
