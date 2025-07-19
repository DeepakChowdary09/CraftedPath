import { serve } from "inngest/next";
import { helloWorld } from "@/lib/inngest/functions";

export const { GET, POST } = serve("craftedpath", [helloWorld]);
