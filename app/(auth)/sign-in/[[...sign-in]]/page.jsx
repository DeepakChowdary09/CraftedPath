import GuestLoginButton from "@/components/ui/guest-login-button";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <SignIn />
      <div className="w-full max-w-sm">
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <GuestLoginButton />
      </div>
    </div>
  );
}