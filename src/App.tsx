import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Retro from "./pages/Retro.tsx";
import AllProjects from "./pages/AllProjects.tsx";
import NotFound from "./pages/NotFound.tsx";
import { CursorEffect } from '@/components/cursorEffect.tsx';
import Loader from "@/components/Loader.tsx";


const queryClient = new QueryClient();

// 7 frames at 100ms ≈ 700ms per cycle — 3 cycles ≈ 2.1s before dismissing
const LOADER_DURATION = 2100;

// Route-aware chrome: the retro desktop (`/`) gets the boot-screen loader and keeps its own
// pixel cursor, so the custom CursorEffect only runs on the classic pages.
const RouteChrome = () => {
  const { pathname } = useLocation();
  const isRetro = pathname === "/";
  const [loaderVariant] = useState<"classic" | "retro">(isRetro ? "retro" : "classic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOADER_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Loader loading={loading} variant={loaderVariant} />
      {!isRetro && <CursorEffect />}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteChrome />
          <Routes>
            <Route path="/" element={<Retro />} />
            <Route path="/classic" element={<Index />} />
            <Route path="/projects" element={<AllProjects />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
