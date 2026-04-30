"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FileText, BrainCircuit, Briefcase, Mail, Target, CheckCircle2 } from "lucide-react";

const STATUS_COLORS = {
  APPLIED: "#3b82f6",
  INTERVIEWING: "#eab308",
  OFFERED: "#22c55e",
  REJECTED: "#ef4444",
  WITHDRAWN: "#6b7280",
};

const STAT_CARDS = [
  { key: "resumeVersionCount", label: "Resume Versions", icon: FileText, color: "text-blue-500" },
  { key: "assessmentCount", label: "Assessments Taken", icon: BrainCircuit, color: "text-purple-500" },
  { key: "applicationCount", label: "Applications", icon: Briefcase, color: "text-orange-500" },
  { key: "coverLetterCount", label: "Cover Letters", icon: Mail, color: "text-pink-500" },
  { key: "goalCount", label: "Goals Set", icon: Target, color: "text-yellow-500" },
  { key: "completedGoalCount", label: "Goals Completed", icon: CheckCircle2, color: "text-green-500" },
];

export default function ProgressDashboard({ stats }) {
  const pieData = stats.applicationsByStatus.map((row) => ({
    name: row.status,
    value: row._count.status,
  }));

  const scoreData = stats.recentAssessments.map((a, i) => ({
    name: `Quiz ${i + 1}`,
    score: Math.round(a.quizScore),
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{stats[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Applications by Status</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {scoreData.length > 0 && (
          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Quiz Scores</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length === 0 && scoreData.length === 0 && (
          <div className="md:col-span-2 text-center py-16 border rounded-xl text-muted-foreground">
            <p className="font-medium">No activity data yet.</p>
            <p className="text-sm mt-1">Start using the app features to see your progress here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
