import React from "react";
import { BackgroundBeamsWithCollision } from "./ui/background-beams-with-collision";

const BeamTest = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#121212",
      }}
    >
      <BackgroundBeamsWithCollision className="absolute inset-0">
        <div
          style={{
            position: "absolute",
            top: "33%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "5rem",
              fontWeight: "bold",
              color: "#E0E0E0",
              marginBottom: "1rem",
            }}
          >
            BEAM TEST
          </h2>
          <div
            style={{
              background:
                "linear-gradient(to right, #00ADB5, #FFAD46, #FF6B6B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "2.5rem",
              marginTop: "1rem",
            }}
          >
            Colorful Animated Beams
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    </div>
  );
};

export default BeamTest;
