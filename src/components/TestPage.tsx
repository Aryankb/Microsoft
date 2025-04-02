import React from "react";
import BackgroundBeamsWithCollisionDemo from "./ui/background-beams-with-collision-demo";

const TestPage = () => {
  return (
    <div className="h-screen w-screen">
      <BackgroundBeamsWithCollisionDemo />

      <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)]">
            Create Workflow
          </button>
          <button className="px-6 py-3 rounded-lg bg-[var(--color-button-secondary)]">
            General Query
          </button>
        </div>

        <div className="w-full max-w-xl px-4 py-2 mt-4 bg-[var(--color-button-secondary)] rounded-lg text-[var(--color-text)]">
          Input area would go here
        </div>

        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <button className="px-4 py-2 bg-[var(--color-card)] rounded-full text-sm whitespace-nowrap">
            Example prompt 1
          </button>
          <button className="px-4 py-2 bg-[var(--color-card)] rounded-full text-sm whitespace-nowrap">
            Example prompt 2
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
