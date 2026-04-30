import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Hero from "@/components/ui/Hero";
import Header from "@/components/ui/Header";
import { features } from "@/data/features";
import { howItWorks } from "@/data/howItWorks";
import { testimonial } from "@/data/testimonial";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { faqs } from "./../data/faqs";

// Sub-component for Features Section
const FeaturesSection = () => (
  <section className="px-6 py-16 md:px-12">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          Powerful Features for Your Career Growth
        </h2>
        <p className="text-muted-foreground">Everything you need to land your dream role, in one place.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="group transition-all duration-200 border border-border/60 hover:border-indigo-500/30 hover:shadow-lg hover:-translate-y-0.5"
          >
            <CardContent className="p-6 space-y-3">
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Sub-component for Industry Statistics Section
const IndustryStatisticsSection = () => (
  <section className="px-6 py-16 md:px-12">
    <div className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-cyan-500/5 p-10">
        <h2 className="text-2xl font-bold text-center mb-10 tracking-tight">Trusted by Job Seekers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: "50+", label: "Industries Covered" },
            { stat: "1000+", label: "Interview Questions" },
            { stat: "95%", label: "Success Rate" },
            { stat: "24/7", label: "AI Support" },
          ].map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="text-4xl font-extrabold gradient-title">{item.stat}</div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// Sub-component for How It Works Section
const HowItWorksSection = () => (
  <section className="px-6 py-16 md:px-12 bg-muted/30">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">How It Works</h2>
        <p className="text-muted-foreground">Four simple steps to accelerate your career growth</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center space-y-3 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
              {item.icon}
            </div>
            <div className="w-6 h-px bg-gradient-to-r from-indigo-500/40 to-violet-500/40" />
            <h3 className="text-base font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Sub-component for User Reviews Section
const UserReviewsSection = () => (
  <section className="px-6 py-16 md:px-12">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">What Our Users Say</h2>
        <p className="text-muted-foreground">Real stories from real career growers</p>
      </div>
      <div className="flex flex-wrap justify-center gap-5">
        {testimonial.map((t, index) => (
          <Card
            key={index}
            className="transition-all duration-200 border border-border/60 hover:border-indigo-500/30 hover:shadow-lg hover:-translate-y-0.5 w-full max-w-sm"
          >
            <CardContent className="p-6 space-y-4">
              <blockquote className="text-sm text-muted-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                <Image
                  width={36}
                  height={36}
                  src={t.image}
                  alt={t.author || "User"}
                  className="rounded-full object-cover border border-border/60"
                />
                <div>
                  <p className="text-sm font-semibold">{t.author || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · <span className="text-indigo-400">{t.company}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Sub-component for FAQ Section
const FAQSection = () => (
  <section className="px-6 py-16 md:px-12 bg-muted/20">
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">Frequently Asked Questions</h2>
        <p className="text-muted-foreground text-sm">Find answers to common questions about our platform</p>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((item, index) => (
          <AccordionItem
            value={`item-${index}`}
            key={index}
            className="border border-border/60 rounded-xl px-4 hover:border-indigo-500/30 transition-colors"
          >
            <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">{item.question}</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground pb-2 leading-relaxed">{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

// Sub-component for Call to Action Section
const CallToActionSection = () => (
  <section className="px-6 py-20 md:px-12">
    <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-600 opacity-90" />
      <div className="absolute inset-0 hero-gradient-bg opacity-40" />
      <div className="relative z-10 py-20 px-8 flex flex-col items-center text-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Ready to Accelerate Your Career?
        </h2>
        <p className="max-w-[520px] text-white/75 text-base md:text-lg">
          Join CraftedPath today and unlock your professional potential. CraftedPath is here to help you succeed.
        </p>
        <Link href="/dashboard">
          <Button
            size="lg"
            className="mt-2 gap-2 bg-white text-indigo-700 hover:bg-white/90 font-semibold shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            Start Your Journey Today
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <>
      <Header />
      <div>
        <div className="grid-background" aria-hidden="true"></div>
        <Hero />
        <FeaturesSection />
        <IndustryStatisticsSection />
        <HowItWorksSection />
        <UserReviewsSection />
        <FAQSection />
        <CallToActionSection />
      </div>
      <footer className="border-t border-border/40 py-10 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">CP</span>
            </div>
            <span className="text-sm font-medium text-foreground">CraftedPath</span>
          </div>
          <p className="text-xs">Made with ❤️ by Dev &nbsp;·&nbsp; &copy; 2025 CraftedPath. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
