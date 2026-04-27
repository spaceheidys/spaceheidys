import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting per IP
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ valid: false, error: "Too many attempts. Try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!code || code.length > 500) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the code server-side via bcrypt-backed RPC. The plaintext
    // hash never leaves the database.
    const { data: isValid, error: verifyError } = await supabaseAdmin
      .rpc("verify_secret_door_code", { _code: code });

    if (verifyError || isValid !== true) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code is valid — fetch secret door files and generate signed URLs
    const { data: files } = await supabaseAdmin
      .from("secret_door_files")
      .select("id, file_name, file_size, file_url, sort_order")
      .order("sort_order");

    const signedFiles = [];
    if (files) {
      for (const f of files) {
        const bucketPath = extractStoragePath(f.file_url);
        if (bucketPath) {
          const { data: signedData } = await supabaseAdmin.storage
            .from(bucketPath.bucket)
            .createSignedUrl(bucketPath.path, 600); // 10 minute expiry

          signedFiles.push({
            id: f.id,
            file_name: f.file_name,
            file_size: f.file_size,
            file_url: signedData?.signedUrl || null,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ valid: true, files: signedFiles }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractStoragePath(url: string): { bucket: string; path: string } | null {
  // Match URLs like .../storage/v1/object/public/bucket-name/path or .../storage/v1/object/bucket-name/path
  const match = url.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)/);
  if (match) {
    return { bucket: match[1], path: match[2] };
  }
  // Relative path fallback
  if (!url.startsWith("http")) {
    return { bucket: "secret-door-private", path: url };
  }
  return null;
}
