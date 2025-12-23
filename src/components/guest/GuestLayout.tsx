import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import GuestNavigation from "./GuestNavigation";

interface GuestLayoutProps {
  children: React.ReactNode;
}

const GuestLayout = ({ children }: GuestLayoutProps) => {
  const { user, guestProfile, loading, isGuest } = useGuestAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/guest/login");
      } else if (user && !isGuest) {
        // User is logged in but not a guest - might be an owner
        navigate("/guest/login");
      }
    }
  }, [user, isGuest, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !guestProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <GuestNavigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default GuestLayout;
