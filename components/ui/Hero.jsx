"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const Hero = () => {
  const imageRef = useRef(null); 

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Calculate rotation angle based on scroll
      const maxTilt = -10; // Maximum backward tilt in degrees
      const scrollLimit = 300; // Max scroll that affects rotation
      const tilt = Math.max(maxTilt, (-scrollY / scrollLimit) * maxTilt); // clamps at -10deg

      if (imageRef.current) {
        imageRef.current.style.transform = `rotateX(${tilt}deg)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="w-full pt-36 md:pt-48 pb-10">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Your AI Career Coach for <br /> Professional Success
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Advance your career with personalized AI-driven coaching, insights, and tools built to accelerate your job search.
        </p>

        <div className="flex justify-center space-x-4 mt-10">
          <Link href="/dashboard" className="inline-block" aria-label="Get started with your career coaching">
            <Button size="lg" className="px-8">Get Started</Button>
          </Link>
          <Link
            href="https://www.youtube.com/watch?v=UbXpRv5ApKA&t=1949s"
            className="inline-block"
            aria-label="Watch introduction video"
          >
            <Button size="lg" className="px-8">Watch Video</Button>
          </Link>
        </div>
      </div>

      <div className="hero-image-wrapper mt-10 md:mt-16 perspective-[1000px]">
        <div
          ref={imageRef}
          className="hero-image transition-transform duration-200 ease-out origin-bottom"
        >
          <Image
            src="/banner.jpeg"
            width={1280}
            height={720}
            alt="AI Career Coaching Banner for Professional Success"
            className="rounded-lg shadow-2xl border mx-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
