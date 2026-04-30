import { Suspense } from "react";
import { PageLoader } from "@/components/ui/page-loader";

export default function Layout({ children }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}