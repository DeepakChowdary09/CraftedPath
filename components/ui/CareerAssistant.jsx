"use client";

import { useState, useRef, useEffect } from "react";
import { getChatbotResponse } from "@/actions/chatbot";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SUGGESTION = [
  "How are my job applications?",
  "What skills am I missing?",
  "Show my interview scores",
  "How are my goals?",
  "What can you help with?",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
        <Bot className="w-3 h-3 text-indigo-400" />
      </div>
      <div className="flex gap-1 px-3 py-2.5 rounded-2xl rounded-bl-sm bg-muted/60 border border-border/40">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isBot = msg.role === "bot";

  return (
    <div className={cn("flex items-end gap-2", !isBot && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
          isBot
            ? "bg-indigo-500/20 border border-indigo-500/30"
            : "bg-violet-500/20 border border-violet-500/30"
        )}
      >
        {isBot ? (
          <Bot className="w-3 h-3 text-indigo-400" />
        ) : (
          <User className="w-3 h-3 text-violet-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
          isBot
            ? "rounded-bl-sm bg-muted/60 border border-border/40 text-foreground"
            : "rounded-br-sm bg-indigo-600 text-white"
        )}
      >
        {/* Main text — parse **bold** */}
        <p
          dangerouslySetInnerHTML={{
            __html: msg.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
          }}
        />

        {/* Bullet points */}
        {msg.bullets?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {msg.bullets.map((b, i) => (
              <li
                key={i}
                className="flex gap-1.5 text-xs opacity-90"
                dangerouslySetInnerHTML={{
                  __html:
                    b.startsWith("•") || b.startsWith("-")
                      ? b.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      : `<span class="mt-0.5 shrink-0">·</span> ${b.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}`,
                }}
              />
            ))}
          </ul>
        )}

        {/* CTA link */}
        {msg.link && (
          <Link
            href={msg.link.href}
            className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            {msg.link.label}
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CareerAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: "bot",
      text: "Hi! I'm your **Career Assistant**. Ask me about your resume, applications, skills, interview prep, or goals.",
      bullets: [],
      link: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: userMsg, bullets: [], link: null },
    ]);
    setLoading(true);

    const response = await getChatbotResponse(userMsg);

    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, role: "bot", ...response },
    ]);
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* ── Chat Panel ── */}
      <div
        className={cn(
          "fixed bottom-20 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ maxHeight: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 rounded-t-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Career Assistant</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Powered by your data</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setOpen(false)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0" style={{ maxHeight: "340px" }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (only if no user messages yet) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/15 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-border/60 flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about resume, jobs, skills…"
            className="flex-1 text-xs bg-muted/40 border border-border/40 rounded-xl px-3 py-2 outline-none focus:border-indigo-500/50 focus:bg-muted/60 placeholder:text-muted-foreground/50 transition-colors"
            disabled={loading}
          />
          <Button
            size="icon"
            className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </Button>
        </div>
      </div>

      {/* ── Floating Toggle Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-5 right-4 sm:right-6 z-50 w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 hover:scale-105 hover:shadow-indigo-500/30 hover:shadow-xl",
          open && "rotate-12"
        )}
        aria-label="Toggle Career Assistant"
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </button>
    </>
  );
}
