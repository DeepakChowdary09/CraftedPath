"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, FileText, GraduationCap } from "lucide-react";

const STATS = [
  { icon: FileText, label: "Resume Built", value: "12k+" },
  { icon: GraduationCap, label: "Interviews Aced", value: "8k+" },
  { icon: TrendingUp, label: "Offers Received", value: "3k+" },
];

const Hero = () => {

  return (
    <section className="relative w-full pt-36 md:pt-48 pb-16 overflow-hidden">
      {/* Animated blob background */}
      <div className="absolute inset-0 -z-10 hero-gradient-bg" aria-hidden="true" />
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl -z-10"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.22 264), transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl -z-10"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.18 200), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto text-center px-4">
        {/* Eyebrow badge */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
            <Sparkles className="w-3 h-3" />
            AI-Powered Career Platform
          </Badge>
        </div>

        {/* Gradient headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight animate-fade-in">
          Your AI Career Coach for{" "}
          <span className="gradient-title block sm:inline">
            Professional Success
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in">
          Advance your career with personalized AI-driven coaching, insights, and tools built to accelerate your job search.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10 animate-fade-in">
          <Link href="/dashboard" aria-label="Get started with your career coaching">
            <Button
              size="lg"
              className="px-8 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link
            href="https://www.youtube.com/watch?v=UbXpRv5ApKA&t=1949s"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch introduction video"
          >
            <Button
              size="lg"
              variant="outline"
              className="px-8 gap-2 border-border/60 hover:bg-accent/50 transition-all duration-200"
            >
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Social proof stats */}
        <div className="flex justify-center gap-8 mt-12 animate-fade-in">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-lg font-bold">{value}</span>
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/*
        ── Hero image (commented out) ──────────────────────────────────────
        <div className="hero-image-wrapper mt-14 md:mt-20 px-4">
          <div className="hero-float-wrapper" ref={wrapperRef}>
            <div ref={imageRef} className="hero-parallax-card"
              style={{ transform, transition: "transform 0.12s ease-out" }}>
              <div className="absolute inset-0 rounded-2xl blur-2xl opacity-25 -z-10 scale-110"
                style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 264), oklch(0.65 0.18 200))" }} />
              <Image src="/banner.jpeg" width={1280} height={720}
                alt="AI Career Coaching Banner" className="rounded-2xl shadow-2xl border border-indigo-500/20 mx-auto block" priority />
            </div>
          </div>
        </div>
        ─────────────────────────────────────────────────────────────────── */}

      {/* ── Resume + Cover Letter Preview Cards ── */}
      <div className="mt-16 md:mt-24 px-4 max-w-5xl mx-auto">
        {/* Soft glow behind cards */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[700px] h-[260px] blur-3xl opacity-15 pointer-events-none -z-10"
          style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 264), oklch(0.65 0.18 200))" }}
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">

          {/* ── Resume Card ── */}
          <div className="rounded-2xl bg-white dark:bg-[#0f1117] border border-border/60 shadow-lg p-6 text-left transition-transform duration-200 hover:scale-[1.01] hover:shadow-xl">
            {/* Header label */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-indigo-500">Resume</span>
            </div>

            {/* Name & role */}
            <div className="mb-4 pb-4 border-b border-border/40">
              <h3 className="text-lg font-bold text-foreground">Alex Morgan</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Senior Software Engineer · San Francisco, CA</p>
              <p className="text-xs text-muted-foreground mt-1">alex.morgan@email.com &nbsp;·&nbsp; linkedin.com/in/alexmorgan</p>
            </div>

            {/* Experience */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Experience</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-semibold text-foreground">Software Engineer II</p>
                    <p className="text-[11px] text-muted-foreground">2022 – Present</p>
                  </div>
                  <p className="text-xs text-indigo-400 mb-1.5">Stripe · Full-time</p>
                  <ul className="space-y-1">
                    <li className="text-xs text-muted-foreground flex gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />Led migration of payment APIs serving 40M+ daily transactions</li>
                    <li className="text-xs text-muted-foreground flex gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />Reduced API latency by 38% through query optimization</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "GraphQL"].map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md text-[11px] bg-indigo-500/8 border border-indigo-500/20 text-indigo-400 dark:text-indigo-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Cover Letter Card ── */}
          <div className="rounded-2xl bg-white dark:bg-[#0f1117] border border-border/60 shadow-lg p-6 text-left transition-transform duration-200 hover:scale-[1.01] hover:shadow-xl">
            {/* Header label */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-violet-500">Cover Letter</span>
            </div>

            {/* To / Role */}
            <div className="mb-4 pb-4 border-b border-border/40">
              <p className="text-xs text-muted-foreground">To: Hiring Manager, <span className="font-semibold text-foreground">Vercel</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Re: Senior Frontend Engineer</p>
            </div>

            {/* Letter body */}
            <div className="space-y-3">
              <p className="text-xs text-foreground leading-relaxed">
                Dear Hiring Manager,
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I am excited to apply for the Senior Frontend Engineer role at Vercel. With 5+ years building high-performance web applications at scale, I am drawn to Vercel&apos;s mission of making the web faster for everyone.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                At Stripe, I architected a component library used across 12 product teams, improving design consistency and cutting UI development time by 40%. I have deep experience with Next.js, edge computing, and the performance optimizations that define modern frontend work.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I would love to bring this expertise to Vercel and contribute to the tools millions of developers rely on every day.
              </p>
              <p className="text-xs text-foreground mt-2">
                Sincerely, <span className="font-medium">Alex Morgan</span>
              </p>
            </div>
          </div>

        </div>

        {/* Caption */}
        <p className="text-center text-xs text-muted-foreground mt-5 tracking-wide">
          AI-generated in seconds — personalized to every role
        </p>
      </div>
    </section>
  );
};

export default Hero;
