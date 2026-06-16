import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SecretDoorSettings {
  timer_seconds: number;
  background_url: string | null;
  music_enabled: boolean;
  impulse_speed: number;
  impulse_color: string;
  impulse_enabled: boolean;
  impulse_mode: "smooth" | "linear" | "pulse";
}

const DEFAULTS: SecretDoorSettings = {
  timer_seconds: 60,
  background_url: null,
  music_enabled: true,
  impulse_speed: 4,
  impulse_color: "#ffffff",
  impulse_enabled: true,
  impulse_mode: "smooth",
};

export function useSecretDoorSettings() {
  const [settings, setSettings] = useState<SecretDoorSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("secret_door_public_settings" as any)
      .select("timer_seconds, background_url, music_enabled, impulse_speed, impulse_color, impulse_enabled, impulse_mode")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setSettings({
            timer_seconds: d.timer_seconds ?? DEFAULTS.timer_seconds,
            background_url: d.background_url ?? null,
            music_enabled: d.music_enabled ?? true,
            impulse_speed: Number(d.impulse_speed ?? DEFAULTS.impulse_speed),
            impulse_color: d.impulse_color ?? DEFAULTS.impulse_color,
            impulse_enabled: d.impulse_enabled ?? true,
            impulse_mode: (d.impulse_mode as any) ?? DEFAULTS.impulse_mode,
          });
        }
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
