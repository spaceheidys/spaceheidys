import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SoundProvider } from "@/contexts/SoundContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Gallery = lazy(() => import("./pages/Gallery"));
const SecretPage = lazy(() => import("./pages/SecretPage"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMain = lazy(() => import("./pages/AdminMain"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminSecretDoor = lazy(() => import("./pages/AdminSecretDoor"));
const AdminSEO = lazy(() => import("./pages/AdminSEO"));
const Shop = lazy(() => import("./pages/Shop"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[100svh] bg-background flex items-center justify-center">
    <div className="w-5 h-5 border border-foreground/30 border-t-foreground animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SoundProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/secret" element={<SecretPage />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/main" element={<AdminMain />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/secret-door" element={<AdminSecretDoor />} />
              <Route path="/admin/seo" element={<AdminSEO />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SoundProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
