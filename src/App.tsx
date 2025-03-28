import { ClerkProvider, SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "../src/components/MainLayout";
import bgImage from "./assets/robot_final.jpg";
import CreateToolPage from './components/CreateToolPage';
import ApiKeyModal from './components/ApiKeyModal';
import ManageAuth from './components/ManageAuth';
const CLERK_PUBLISHABLE_KEY = "pk_test_bWludC1kaW5vc2F1ci01NC5jbGVyay5hY2NvdW50cy5kZXYk";

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Router>
        <SignedOut>
          <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            <div style={{ position: "absolute", left: "20%" }}>
              <SignIn
                appearance={{
                  layout: {
                    logoPlacement: "none",
                    socialButtonsVariant: "iconButton",
                  },
                  variables: {
                    colorPrimary: "white",
                    colorBackground: "rgba(0, 0, 0, 1)",
                    colorText: "white",
                    colorTextSecondary: "white",
                    colorInputBackground: "white",
                    colorInputBorder: "#00ffff",
                    colorButtonText: "white",
                  },
                  elements: {
                    card: {
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      border: "2px solid #00ffff",
                      borderRadius: "15px",
                      boxShadow: "0px 0px 20px #00ffff",
                    },
                    headerTitle: {
                      color: "white",
                      fontSize: "24px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      fontFamily: "'Orbitron', sans-serif",
                    },
                    formFieldInput: {
                      backgroundColor: "rgba(7, 206, 233, 0.4)",
                      color: "black",
                      borderColor: "white",
                      fontFamily: "'Orbitron', sans-serif",
                    },
                    formButtonPrimary: {
                      backgroundColor: "#E50914",
                      color: "rgb(0, 0, 0)",
                      fontWeight: "bold",
                      fontFamily: "'Orbitron', sans-serif",
                      textTransform: "uppercase",
                    },
                    footer: {
                      backgroundColor: "rgba(0, 0, 0, 0)",
                      letterSpacing: "2px",
                    },
                  },
                }}
              />
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <Routes>
            <Route path="/*" element={<MainLayoutWithAuthCheck />} />
            <Route path="/create-tool" element={<CreateToolPage />} />
            <Route path="/api-keys" element={<ManageAuth/>} />
            <Route path="/manage-auths" element={<ManageAuth/>}/>
          </Routes>
        </SignedIn>
      </Router>
    </ClerkProvider>
  );
}

// ✅ Move useAuth inside a child component
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
function MainLayoutWithAuthCheck() {
  const { getToken } = useAuth();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:8000/checkuser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("User Check Response:", data);
      } catch (error) {
        console.error("Error checking user:", error);
      }
    };

    checkUser();
  }, [getToken]);

  return <MainLayout />;
}

export default App;
