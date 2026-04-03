import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SecretDoorSettings {
  timer_seconds: number;
  background_url: string | null;
  music_enabled: boolean;
}

const DEFAULTS: SecretDoorSettings = {
  timer_seconds: 60,
  background_url: null,
  music_enabled: true,
};

export function useSecretDoorSettings() {
  const [settings, setSettings] = useState<SecretDoorSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("secret_door_public_settings" as any)
      .select("timer_seconds, background_url, music_enabled")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data as any as SecretDoorSettings);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export interface SecretDoorFile {
  id: string;
  file_name: string;
  file_url: string | null;
  file_size: number;
}

export async function verifySecretCode(code: string): Promise<{ valid: boolean; files?: SecretDoorFile[] }> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-secret-code", {
      body: { code },
    });
    if (error) return { valid: false };
    if (data?.valid === true) {
      return { valid: true, files: data.files || [] };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}
