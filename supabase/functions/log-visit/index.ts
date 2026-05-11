import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SECRET_SALT = Deno.env.get("SUPABASE_JWKS") ?? "fallback-salt-rotate-me";

function parseUA(ua: string) {
  const u = ua.toLowerCase();
  let device = "desktop";
  if (/ipad|tablet/.test(u)) device = "tablet";
  else if (/mobile|iphone|android(?!.*tablet)/.test(u)) device = "mobile";

  let browser = "Other";
  if (/edg\//.test(u)) browser = "Edge";
  else if (/chrome\//.test(u) && !/edg\//.test(u)) browser = "Chrome";
  else if (/safari\//.test(u) && !/chrome\//.test(u)) browser = "Safari";
  else if (/firefox\//.test(u)) browser = "Firefox";

  let os = "Other";
  if (/windows/.test(u)) os = "Windows";
  else if (/mac os|macintosh/.test(u)) os = "macOS";
  else if (/iphone|ipad|ios/.test(u)) os = "iOS";
  else if (/android/.test(u)) os = "Android";
  else if (/linux/.test(u)) os = "Linux";

  return { device, browser, os };
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cleanReferrer(ref: string | null | undefined) {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.hostname;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
    const referrer = cleanReferrer(typeof body.referrer === "string" ? body.referrer : null);

    // Extract IP (used only transiently for geo + hash, never stored)
    const fwd = req.headers.get("x-forwarded-for") ?? "";
    const ip = fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "0.0.0.0";
    const ua = req.headers.get("user-agent") ?? "";

    // Daily anonymous visitor hash (rotates every UTC day)
    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = (await sha256Hex(`${ip}|${ua}|${day}|${SECRET_SALT}`)).slice(0, 16);

    // Geolocate (best-effort, free, no key). Skip for local IPs.
    let country: string | null = null;
    let countryName: string | null = null;
    let city: string | null = null;
    let region: string | null = null;
    if (ip && ip !== "0.0.0.0" && !ip.startsWith("127.") && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
      try {
        const r = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city`,
          { signal: AbortSignal.timeout(2500) }
        );
        if (r.ok) {
          const j = await r.json();
          if (j.status === "success") {
            country = j.countryCode ?? null;
            countryName = j.country ?? null;
            city = j.city ?? null;
            region = j.regionName ?? null;
          }
        }
      } catch {
        /* geo failed — continue without */
      }
    }

    const { device, browser, os } = parseUA(ua);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("visit_logs").insert({
      visitor_hash: visitorHash,
      country,
      country_name: countryName,
      city,
      region,
      device,
      browser,
      os,
      referrer,
      path,
    });

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});