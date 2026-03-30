import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string | null;
  username: string;
  created_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const loadOrCreateProfile = useCallback(async (currentUser: User) => {
    setLoading(true);
    setError(null);

    try {
      // Try to load existing profile
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (data) {
        setProfile(data as Profile);
      } else {
        // Auto-create profile if missing
        const username = currentUser.email
          ? currentUser.email.split("@")[0]
          : "user";

        const { data: newProfile, error: insertErr } = await supabase
          .from("profiles")
          .insert({ id: currentUser.id, email: currentUser.email, username })
          .select()
          .single();

        if (insertErr) throw insertErr;
        setProfile(newProfile as Profile);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          setTimeout(() => loadOrCreateProfile(u), 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadOrCreateProfile(u);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadOrCreateProfile]);

  const updateUsername = useCallback(async (newUsername: string) => {
    if (!user) return { success: false, error: "Not authenticated" };
    setSaving(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setProfile((prev) => prev ? { ...prev, username: newUsername } : prev);
      return { success: true, error: null };
    } catch (err: any) {
      const msg = err.message || "Failed to save";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSaving(false);
    }
  }, [user]);

  return { profile, user, loading, saving, error, updateUsername };
};
