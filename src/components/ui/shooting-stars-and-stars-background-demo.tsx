"use client";
import React from "react";
import { ShootingStars } from "./shooting-stars";
import { StarsBackground } from "./stars-background";

export default function ShootingStarsAndStarsBackgroundDemo() {
  return (
    <div className="absolute inset-0">
      <ShootingStars
        starColor="#00ADB5"
        trailColor="#006a70"
        minDelay={800}
        maxDelay={3000}
        starWidth={15}
        starHeight={2}
      />
      <StarsBackground starDensity={0.0004} allStarsTwinkle={true} />
    </div>
  );
}
