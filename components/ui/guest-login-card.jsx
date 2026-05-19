"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { guestLogin } from "@/actions/guest-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function GuestLoginCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      guestLogin(formData).then((result) => {
        if (!result?.success) {
          toast.error(result?.error || "Login failed. Please try again.");
          return;
        }

        toast.success("Welcome! You are signed in as a guest.");
        router.push(result.redirectTo || "/dashboard");
      });
    });
  };

  return (
    <Card className="w-full max-w-md border border-dashed border-muted-foreground/40 shadow-none">
      <CardHeader>
        <CardTitle>Guest Access</CardTitle>
        <CardDescription>
          Enter the shared guest credentials provided in onboarding to explore CraftedPath.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="space-y-2">
            <Label htmlFor="guest-email">Email</Label>
            <Input
              id="guest-email"
              name="email"
              type="email"
              placeholder="guest@example.com"
              value={formValues.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-password">Password</Label>
            <Input
              id="guest-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formValues.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in as Guest"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Need credentials? Contact the admin team to request access.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
