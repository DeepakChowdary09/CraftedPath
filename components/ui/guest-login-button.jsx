"use client";

import { Button } from "@/components/ui/button";
import { useSignIn } from "@clerk/nextjs";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { seedGuestProfile } from "@/actions/guest";

/**
 * One-click guest access using a shared demo Clerk account.
 * Requires NEXT_PUBLIC_GUEST_EMAIL + NEXT_PUBLIC_GUEST_PASSWORD in environment variables.
 */
export default function GuestLoginButton() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = async () => {
    if (!isLoaded) return;

    const email = process.env.NEXT_PUBLIC_GUEST_EMAIL;
    const password = process.env.NEXT_PUBLIC_GUEST_PASSWORD;

    if (!email || !password) {
      toast.error("Guest login is not configured. Add NEXT_PUBLIC_GUEST_EMAIL and NEXT_PUBLIC_GUEST_PASSWORD to .env.local");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Pre-seed guest profile with demo data so dashboard works immediately
        try {
          const clerkUserId = result.createdUserId;
          if (clerkUserId) {
            await seedGuestProfile(clerkUserId);
          }
        } catch {
          // Seeding is best-effort; checkUser + onboarding will handle it
        }

        toast.success("Signed in as Guest!");
        router.push("/dashboard");
      } else {
        toast.error("Guest login incomplete. Please try again.");
      }
    } catch (err) {
      console.error("Guest login error:", err);
      toast.error(err?.errors?.[0]?.message || "Guest login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full gap-2 border-dashed border-muted-foreground/50 hover:border-primary/60 hover:bg-primary/5"
      onClick={handleGuestLogin}
      disabled={loading || !isLoaded}
    >
      <UserRound className="h-4 w-4" />
      {loading ? "Signing in as Guest…" : "Continue as Guest"}
    </Button>
  );
}
