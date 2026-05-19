"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * React hook for subscribing to agent streaming events
 */
export function useAgentStream() {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/streaming");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Skip heartbeat
        if (data.type === "connected") {
          return;
        }

        setEvents((prev) => [...prev, { ...data, receivedAt: new Date() }]);
      } catch (err) {
        console.error("[useAgentStream] Error parsing event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[useAgentStream] SSE error:", err);
      setIsConnected(false);
      setError("Connection lost. Retrying...");
      
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          connect();
        }
      }, 3000);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    events,
    isConnected,
    error,
    connect,
    disconnect,
    clearEvents,
  };
}

/**
 * Hook for filtering events by workflow or agent type
 */
export function useFilteredAgentStream(filter = {}) {
  const { events, ...rest } = useAgentStream();

  const filteredEvents = events.filter((event) => {
    if (filter.workflowId && event.workflowId !== filter.workflowId) {
      return false;
    }
    if (filter.agentType && event.agentType !== filter.agentType) {
      return false;
    }
    if (filter.stepId && event.stepId !== filter.stepId) {
      return false;
    }
    if (filter.type && event.type !== filter.type) {
      return false;
    }
    return true;
  });

  return {
    events: filteredEvents,
    ...rest,
  };
}

/**
 * Hook for terminal-style log display
 */
export function useAgentTerminal(maxLines = 100) {
  const { events, isConnected, error } = useAgentStream();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Transform events into terminal-friendly format
    const newLogs = events.map((event) => ({
      id: `${event.timestamp}-${Math.random()}`,
      timestamp: new Date(event.timestamp || Date.now()),
      agent: event.agentType || event.type,
      step: event.stepId || event.step,
      message: event.message,
      status: event.status,
      metadata: event.metadata,
    }));

    setLogs((prev) => {
      const combined = [...prev, ...newLogs];
      // Keep only the last maxLines
      return combined.slice(-maxLines);
    });
  }, [events, maxLines]);

  return {
    logs,
    isConnected,
    error,
    clearLogs: () => setLogs([]),
  };
}
