import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SoundProvider } from "@/contexts/SoundContext";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import SecretPage from "./pages/SecretPage";
import Admin from "./pages/Admin";
import AdminMain from "./pages/AdminMain";
import AdminLogin from "./pages/AdminLogin";
import AdminSecretDoor from "./pages/AdminSecretDoor";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SoundProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/secret" element={<SecretPage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/main" element={<AdminMain />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/secret-door" element={<AdminSecretDoor />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SoundProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
