/**
 * Server-Sent Events (SSE) API for Agent Streaming
 * Provides real-time updates from agent workflows
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { globalWorkflowEmitter, type WorkflowEvent } from "@/lib/workflows/event-emitter";
import { subscribeToAgentEvents } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  
  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", message: "Stream connected" })}\n\n`)
      );

      // Subscribe to workflow events
      const unsubscribeWorkflow = globalWorkflowEmitter.on((event: WorkflowEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch (err) {
          // Stream closed
          unsubscribeWorkflow();
        }
      });

      // Subscribe to agent events
      const unsubscribeAgent = subscribeToAgentEvents((event: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch (err) {
          // Stream closed
          unsubscribeAgent();
        }
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch (err) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribeWorkflow();
        unsubscribeAgent();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
