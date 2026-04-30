"use client";

import { Briefcase, MessageSquare, CheckCircle, XCircle, MinusCircle } from "lucide-react";

const CARDS = [
  {
    key: "APPLIED",
    label: "Applied",
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "INTERVIEWING",
    label: "Interviewing",
    icon: MessageSquare,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950",
  },
  {
    key: "OFFERED",
    label: "Offered",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950",
  },
  {
    key: "REJECTED",
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950",
  },
  {
    key: "WITHDRAWN",
    label: "Withdrawn",
    icon: MinusCircle,
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900",
  },
];

export default function StatusSummaryCards({ summary }) {
  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className={`rounded-xl border p-4 flex flex-col gap-2 ${bg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className={`text-2xl font-bold ${color}`}>{summary[key] ?? 0}</p>
          {total > 0 && (
            <p className="text-xs text-muted-foreground">
              {Math.round(((summary[key] ?? 0) / total) * 100)}% of total
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
