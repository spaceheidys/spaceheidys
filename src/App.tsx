import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SoundProvider } from "@/contexts/SoundContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Retries a dynamic import once, then force-reloads the page.
// Fixes "Failed to fetch dynamically imported module" caused by stale chunk
// hashes after a new deploy.
const lazyWithRetry = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = "chunk-reload-attempt";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw err;
    }
  });

const Gallery = lazyWithRetry(() => import("./pages/Gallery"));
const SecretPage = lazyWithRetry(() => import("./pages/SecretPage"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const AdminMain = lazyWithRetry(() => import("./pages/AdminMain"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminSecretDoor = lazyWithRetry(() => import("./pages/AdminSecretDoor"));
const AdminSEO = lazyWithRetry(() => import("./pages/AdminSEO"));
const AdminShop = lazyWithRetry(() => import("./pages/AdminShop"));
const AdminVisits = lazyWithRetry(() => import("./pages/AdminVisits"));
const Shop = lazyWithRetry(() => import("./pages/Shop"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[100svh] bg-background flex items-center justify-center">
    <div className="w-5 h-5 border border-foreground/30 border-t-foreground animate-spin" />
  </div>
);

const App = () => {
  // Clear the retry flag once the app has loaded successfully.
  if (typeof window !== "undefined") sessionStorage.removeItem("chunk-reload-attempt");
  return (
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
              <Route path="/admin/shop" element={<AdminShop />} />
              <Route path="/admin/visits" element={<AdminVisits />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SoundProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
