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
// The retro boot screen reveals its lines one by one, so it stays up a little longer.
const RETRO_LOADER_DURATION = 4600;

// Route-aware chrome: the retro desktop (`/`) gets the boot-screen loader and the pixel cursors
// (html.retro-cursor, styled in retro.css), so the custom CursorEffect only runs on the classic pages.
const RouteChrome = () => {
  const { pathname } = useLocation();
  const isRetro = pathname === "/";
  const [loaderVariant] = useState<"classic" | "retro">(isRetro ? "retro" : "classic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("retro-cursor", isRetro);
    return () => document.documentElement.classList.remove("retro-cursor");
  }, [isRetro]);

  useEffect(() => {
    const duration = loaderVariant === "retro" ? RETRO_LOADER_DURATION : LOADER_DURATION;
    const timer = setTimeout(() => setLoading(false), duration);
    return () => clearTimeout(timer);
  }, [loaderVariant]);

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
