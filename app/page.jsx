import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Hero from "@/components/ui/Hero";
import { features } from "@/data/features";
import { howItWorks } from "@/data/howItWorks";
import { testimonial } from "@/data/testimonial";
import Image from "next/image";
import Link from "next/link";
import { faqs } from "./../data/faqs";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      <div className="grid-background"></div>
      <Hero />

      {/* Features Section */}
      <section className="px-6 py-12 md:px-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-6">
              Powerful features for Your Career Growth
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="transition-colors duration-300 border hover:border-primary hover:shadow-md"
            >
              <CardContent className="p-6 space-y-2">
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Industry Statistics Section */}
      <section className="px-6 py-16 md:px-12 bg-muted/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">Industry Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "50+", label: "Industries Covered" },
              { stat: "1000+", label: "Interview Questions" },
              { stat: "95%", label: "Success Rate" },
              { stat: "24/7", label: "AI Support" },
            ].map((item, index) => (
              <div
                key={index}
                className="space-y-2 hover:text-primary transition-colors duration-300"
              >
                <div className="text-4xl font-bold text-primary">
                  {item.stat}
                </div>
                <p className="text-muted-foreground text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="px-6 py-12 md:px-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Four Simple Steps To Accelerate Your Career Growth
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {howItWorks.map((item, index) => {
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {item.icon}
                </div>

                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* User Reviews Section */}
      <section className="px-6 py-12 md:px-12 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-6">What Our Users Say</h2>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-6">
          {testimonial.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-background hover:shadow-lg transition-shadow duration-300 w-full max-w-xs"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <Image
                    width={40}
                    height={40}
                    src={testimonial.image}
                    alt={testimonial.name || "User profile picture"}
                    className="rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <p className="font-semibold">
                      {testimonial.author || "Anonymous User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                    <p className="text-sm text-primary">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
                <blockquote className="text-muted-foreground text-sm">
                  “{testimonial.quote}”
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/*----------FAQ Section-----------*/}
      <section className="px-6 py-12 md:px-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Find answers to common questions about our platform
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Accordion type="single" collapsible>
              {faqs.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto py-24 gradient rounded-lg">
          <div className="flex flex-col  items-center justify-center space-y-4 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter  text-primary-foreground sm:text-4xl md:text-5xl">
              Ready to Accelerate Your Career?
            </h2>
            <p className=" mx-auto  max-w-[600px] text-primary-foreground/80 md:text-xl">
              Join CraftedPath today and unlock your professional potential
              , CraftedPath is here to help you succeed.
            </p>

            <Link href="/dashboard" passHref>
              <Button
                size="lg"
                variant= "secondary"
                className="h-11  mt-5 animate-bounce"
              >
                Start Your Journey Today < ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
