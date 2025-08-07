import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "crafted-path",
  name: "CraftedPath",
  apiKey: process.env.INNGEST_API_KEY, // Add the Inngest API key
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});
