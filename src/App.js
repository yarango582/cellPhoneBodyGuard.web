import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Componentes
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);
const auth = getAuth();

const theme = {
  colors: {
    primary: "#007BFF",
    secondary: "#6C757D",
    success: "#28A745",
    danger: "#DC3545",
    warning: "#FFC107",
    info: "#17A2B8",
    light: "#F8F9FA",
    dark: "#343A40",
    white: "#FFFFFF",
    background: "#F8F9FA",
    text: "#333333",
  },
  fonts: {
    main: "'Roboto', sans-serif",
  },
  breakpoints: {
    mobile: "576px",
    tablet: "768px",
    desktop: "992px",
    largeDesktop: "1200px",
  },
};

// Componente principal
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        {user ? (
          <>
            <Navbar user={user} />
            <MainContent>
              <Sidebar />
              <ContentArea>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/devices/:deviceId" element={<DeviceDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ContentArea>
            </MainContent>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

// Estilos
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

export default App;
