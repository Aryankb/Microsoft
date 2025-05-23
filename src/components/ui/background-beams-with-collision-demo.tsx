import React from "react";
import { BackgroundBeamsWithCollision } from "./background-beams-with-collision";

export default function BackgroundBeamsWithCollisionDemo() {
  return (
    <BackgroundBeamsWithCollision className="absolute inset-0">
      <div className="relative left-1/2 z-20 pb-20 text-center transform -translate-y-1/2">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold text-white font-sans tracking-tight mb-2 relative z-30">
          SIGMOYD
        </h2>
        <div className="relative mx-auto pb-12 inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))] z-30">
          <div
            className="relative left-0 top-[1px] [text-shadow:0_0_rgba(0,0,0,0.1)]"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundImage:
                "linear-gradient(to right, #00ADB5, #FFAD46, #FF6B6B)",
            }}
          >
            <span className="text-lg md:text-xl lg:text-2xl">
              AI-Powered Workflow Automation
            </span>
          </div>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
