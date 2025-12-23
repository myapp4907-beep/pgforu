import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Guests from "./pages/Guests";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Properties from "./pages/Properties";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { PropertyProvider } from "./contexts/PropertyContext";
import { FirstPropertySetup } from "./components/FirstPropertySetup";

// Guest imports
import GuestLogin from "./pages/guest/GuestLogin";
import GuestDashboard from "./pages/guest/GuestDashboard";
import GuestProfile from "./pages/guest/GuestProfile";
import GuestPayments from "./pages/guest/GuestPayments";
import GuestMaintenance from "./pages/guest/GuestMaintenance";
import GuestRules from "./pages/guest/GuestRules";
import GuestLayout from "./components/guest/GuestLayout";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <PropertyProvider>
      <FirstPropertySetup />
      {children}
    </PropertyProvider>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Guest Routes */}
          <Route path="/guest/login" element={<GuestLogin />} />
          <Route path="/guest/dashboard" element={<GuestLayout><GuestDashboard /></GuestLayout>} />
          <Route path="/guest/profile" element={<GuestLayout><GuestProfile /></GuestLayout>} />
          <Route path="/guest/payments" element={<GuestLayout><GuestPayments /></GuestLayout>} />
          <Route path="/guest/maintenance" element={<GuestLayout><GuestMaintenance /></GuestLayout>} />
          <Route path="/guest/rules" element={<GuestLayout><GuestRules /></GuestLayout>} />
          
          {/* Owner Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navigation />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
