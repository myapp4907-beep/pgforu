import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GuestProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  room_id: string;
  bed_number: string | null;
  joining_date: string;
  monthly_rent: number;
  payment_status: string;
  status: string;
  emergency_contact: string | null;
  property_id: string;
  room_number?: string;
  property_name?: string;
}

export const useGuestAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  const fetchGuestProfile = async (email: string) => {
    const { data, error } = await supabase
      .from("guests")
      .select(`
        *,
        rooms:room_id (
          room_number,
          property_id,
          properties:property_id (name)
        )
      `)
      .eq("email", email)
      .eq("status", "active")
      .single();

    if (data && !error) {
      setGuestProfile({
        ...data,
        room_number: data.rooms?.room_number,
        property_id: data.rooms?.property_id,
        property_name: data.rooms?.properties?.name,
      });
      setIsGuest(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          setTimeout(() => {
            fetchGuestProfile(session.user.email!);
          }, 0);
        } else {
          setGuestProfile(null);
          setIsGuest(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        fetchGuestProfile(session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setGuestProfile(null);
    setIsGuest(false);
    navigate("/guest/login");
  };

  const refreshProfile = async () => {
    if (user?.email) {
      await fetchGuestProfile(user.email);
    }
  };

  return { user, session, guestProfile, loading, isGuest, signOut, refreshProfile };
};
