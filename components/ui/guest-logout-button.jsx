"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { guestLogout } from "@/actions/guest-auth";
import { Button } from "@/components/ui/button";

export function GuestLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      guestLogout().then(() => {
        toast.success("You have signed out.");
        router.refresh();
      });
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
