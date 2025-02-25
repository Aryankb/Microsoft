import { ClerkProvider, SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "../src/components/MainLayout";
import bgImage from "./assets/robot2.jpg";

const CLERK_PUBLISHABLE_KEY =
  "pk_test_bWludC1kaW5vc2F1ci01NC5jbGVyay5hY2NvdW50cy5kZXYk";

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Router>
        <SignedOut>
          {/* Background Image */}
          <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            {/* Moves SignIn Box left and applies neon style */}
            <div
              style={{
                position: "absolute",
                left: "20%", // Move box to the left
              }}
            >
              <SignIn
  appearance={{
    layout: {
      logoPlacement: "none",
      socialButtonsVariant: "iconButton",
    },
    variables: {
      colorPrimary: "white", 
      colorBackground: "rgba(0, 0, 0, 1)", // Dark translucent background
      colorText: "white", // Neon blue text
      colorTextSecondary: "white", // Neon red secondary text
      colorInputBackground: "white", // Dark input background
      colorInputBorder: "#00ffff", // Neon blue border for input
      colorButtonText: "white", // Dark text inside buttons
    },
    elements: {
      card: {
        backgroundColor: "rgba(0, 174, 255, 0.29)", // Dark translucent box
        border: "2px solid #00ffff", // Neon red border
        borderRadius: "15px",
        boxShadow: "0px 0px 20px #00ffff", // Neon red glow
        // padding: "50px",
      },
      headerTitle: {
        color: "white",
        fontSize: "24px",
        fontWeight: "bold",
        textTransform: "uppercase",
        // letterSpacing: "2px",
        fontFamily: "'Orbitron', sans-serif",
      },
      formFieldInput: {
        backgroundColor: "rgba(7, 206, 233, 0.4)",
        color: "black",
        borderColor: "white",
        // boxShadow: "0px 0px 10pxrgb(11, 95, 95)", // Neon red glow around inputs
        fontFamily: "'Orbitron', sans-serif",
      },
      formButtonPrimary: {
        backgroundColor: "#E50914",
        color: "rgb(0, 0, 0)",
        fontWeight: "bold",
        // borderRadius: "8px",
        // boxShadow: "0px 0px 10px #00ffff",
        fontFamily: "'Orbitron', sans-serif",
        textTransform: "uppercase",
      },
      footer: {
        backgroundColor: "rgba(0, 0, 0, 0)",
        // border: "2px solid #00ffff",
        // boxShadow: "0px 0px 15px #00ffff",
        // color: "#00ffff",
        // fontFamily: "'Orbitron', sans-serif",
        // textTransform: "uppercase",
        letterSpacing: "2px",
        // padding: "15px",
      },
    },
  }}
/>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <Routes>
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </SignedIn>
      </Router>
    </ClerkProvider>
  );
}

export default App;
