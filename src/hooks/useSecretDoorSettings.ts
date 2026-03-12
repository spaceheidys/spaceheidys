import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SecretDoorSettings {
  secret_code: string;
  timer_seconds: number;
  background_url: string | null;
  music_enabled: boolean;
}

const DEFAULTS: SecretDoorSettings = {
  secret_code: "Letmein",
  timer_seconds: 60,
  background_url: null,
  music_enabled: true,
};

export function useSecretDoorSettings() {
  const [settings, setSettings] = useState<SecretDoorSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("secret_door_settings" as any)
      .select("secret_code, timer_seconds, background_url")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data as any as SecretDoorSettings);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export function useSecretDoorFiles() {
  const [files, setFiles] = useState<{ id: string; file_name: string; file_url: string; file_size: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("secret_door_files" as any)
      .select("id, file_name, file_url, file_size")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setFiles(data as any);
        setLoading(false);
      });
  }, []);

  return { files, loading };
}
