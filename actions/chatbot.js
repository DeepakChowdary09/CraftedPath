"use server";

import { getJobStatusSummary } from "@/actions/job-application";
import { getSkillGap } from "@/actions/skill-gap";
import { getProgressStats } from "@/actions/progress";
import { getAssessments } from "@/actions/interview";

//  Intent detection ──────────────────────────────────

const INTENTS = [
  {
    name: "applications",
    keywords: ["application", "applications", "applied", "job status", "tracker", "jobs applied", "how many jobs"],
  },
  {
    name: "skills",
    keywords: ["skill", "skills", "skill gap", "missing skill", "what should i learn", "improve skills", "recommended"],
  },
  {
    name: "resume",
    keywords: ["resume", "cv", "ats", "resume score", "resume tips", "improve resume", "resume help"],
  },
  {
    name: "interview",
    keywords: ["interview", "quiz", "practice", "assessment", "score", "prepare", "interview tips"],
  },
  {
    name: "goals",
    keywords: ["goal", "goals", "progress", "weekly goal", "target", "stats", "overview"],
  },
  {
    name: "help",
    keywords: ["help", "what can you do", "features", "how to use", "guide", "what is"],
  },
];

export async function detectIntent(message) {
  const lower = message.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keywords.some((kw) => lower.includes(kw))) {
      return intent.name;
    }
  }
  return "unknown";
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleApplications() {
  const summary = await getJobStatusSummary();
  const total = summary
    ? Object.values(summary).reduce((acc, n) => acc + n, 0)
    : 0;

  if (!summary || total === 0) {
    return {
      text: "You haven't tracked any job applications yet.",
      bullets: ["Head to **Job Tracker** to start adding applications.", "Track status: Applied, Interview, Offer, Rejected."],
      link: { label: "Open Job Tracker", href: "/job-tracker" },
    };
  }

  const bullets = Object.entries(summary)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`);

  return {
    text: `You have **${total}** job applications tracked.`,
    bullets,
    link: { label: "View Job Tracker", href: "/job-tracker" },
  };
}

async function handleSkills() {
  const gap = await getSkillGap();

  if (!gap || (!gap.matched?.length && !gap.missing?.length)) {
    return {
      text: "No skill data found. Make sure your profile has your industry and skills set.",
      bullets: ["Go to your profile to add skills.", "Complete onboarding to set your industry."],
      link: { label: "View Skill Gap", href: "/dashboard/skills" },
    };
  }

  const top3Missing = gap.missing?.slice(0, 3) ?? [];

  return {
    text: `You match **${gap.matched?.length ?? 0}** industry skills and are missing **${gap.missing?.length ?? 0}**.`,
    bullets: top3Missing.length
      ? ["Top skills to learn:", ...top3Missing.map((s) => `• ${s}`)]
      : ["Great job! You're covering all the key industry skills."],
    link: { label: "Full Skill Analysis", href: "/dashboard/skills" },
  };
}

async function handleResume() {
  const stats = await getProgressStats();
  const count = stats?.resumeVersionCount ?? 0;

  return {
    text: `You have **${count}** resume version${count !== 1 ? "s" : ""} saved.`,
    bullets: [
      "Use the Resume Builder to tailor your resume for each job.",
      "Run ATS analysis to check keyword match with job descriptions.",
      "Save multiple versions for different roles.",
    ],
    link: { label: "Open Resume Builder", href: "/resume" },
  };
}

async function handleInterview() {
  const assessments = await getAssessments();
  const count = assessments?.length ?? 0;

  if (count === 0) {
    return {
      text: "You haven't taken any interview quizzes yet.",
      bullets: [
        "Start a quiz to practice common interview questions.",
        "Track your scores over time in the Interview section.",
      ],
      link: { label: "Start Interview Prep", href: "/interview" },
    };
  }

  const latest = assessments[0];
  const avgScore =
    Math.round(assessments.reduce((acc, a) => acc + (a.quizScore ?? 0), 0) / count);

  return {
    text: `You've completed **${count}** quiz${count !== 1 ? "zes" : ""}. Average score: **${avgScore}%**.`,
    bullets: [
      `Latest quiz score: ${latest.quizScore ?? "N/A"}%`,
      avgScore < 70
        ? "Tip: Focus on your weakest categories and retry."
        : "Great progress! Keep practicing to maintain consistency.",
    ],
    link: { label: "Continue Practicing", href: "/interview" },
  };
}

async function handleGoals() {
  const stats = await getProgressStats();

  if (!stats) {
    return {
      text: "Couldn't load your progress data right now.",
      bullets: ["Try again in a moment."],
      link: null,
    };
  }

  const { goalCount, completedGoalCount, assessmentCount, applicationCount } = stats;
  const pct = goalCount > 0 ? Math.round((completedGoalCount / goalCount) * 100) : 0;

  return {
    text: `You've completed **${completedGoalCount}/${goalCount}** weekly goals (${pct}%).`,
    bullets: [
      `Quizzes taken: ${assessmentCount}`,
      `Applications tracked: ${applicationCount}`,
      pct < 50 ? "Set smaller, specific goals to build momentum." : "You're on track — keep it up!",
    ],
    link: { label: "View Progress", href: "/dashboard/progress" },
  };
}

function handleHelp() {
  return {
    text: "Here's what I can help you with:",
    bullets: [
      "📄 **Resume** — tips, ATS, and resume versions",
      "💼 **Applications** — your job tracker stats",
      "🧠 **Skills** — skill gap vs your industry",
      "🎯 **Interview** — quiz scores and practice tips",
      "📊 **Goals** — weekly goals and progress",
    ],
    link: null,
  };
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

export async function getChatbotResponse(message) {
  const intent = await detectIntent(message);

  try {
    switch (intent) {
      case "applications": return await handleApplications();
      case "skills":       return await handleSkills();
      case "resume":       return await handleResume();
      case "interview":    return await handleInterview();
      case "goals":        return await handleGoals();
      case "help":         return handleHelp();
      default:
        return {
          text: "I couldn't understand that. Try asking about:",
          bullets: ["resume", "job applications", "skills", "interview prep", "goals"],
          link: null,
        };
    }
  } catch {
    return {
      text: "Something went wrong fetching your data.",
      bullets: ["Please try again in a moment."],
      link: null,
    };
  }
}
