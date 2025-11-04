// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { useUser } from "@/hooks/useUser";
import { routesConfig } from "@/config/routesConfig";

const queryClient = new QueryClient();

const App = () => {
  const { role } = useUser(); // Get current role

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            {routesConfig.map(({ path, element, roles }) => {
              // Public route → anyone can see
              if (!roles.length || roles.includes(role)) {
                return <Route key={path} path={path} element={element} />;
              }

              // Unauthorized → redirect to login
              return (
                <Route
                  key={path}
                  path={path}
                  element={<Navigate to="/auth" replace />}
                />
              );
            })}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
