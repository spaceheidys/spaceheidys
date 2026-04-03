import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!code || code.length > 500) {
      return new Response(
        JSON.stringify({ valid: false, error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("secret_door_settings")
      .select("secret_code")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valid = settings.secret_code === code;

    if (!valid) {
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
        // Extract storage path from the public URL or use as-is
        // file_url may be a full public URL or a storage path
        const bucketPath = extractStoragePath(f.file_url);
        if (bucketPath) {
          const { data: signedData } = await supabaseAdmin.storage
            .from(bucketPath.bucket)
            .createSignedUrl(bucketPath.path, 3600); // 1 hour expiry

          signedFiles.push({
            id: f.id,
            file_name: f.file_name,
            file_size: f.file_size,
            file_url: signedData?.signedUrl || null,
          });
        } else {
          // Fallback: file_url doesn't match known pattern, skip
          signedFiles.push({
            id: f.id,
            file_name: f.file_name,
            file_size: f.file_size,
            file_url: null,
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
      JSON.stringify({ valid: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractStoragePath(url: string): { bucket: string; path: string } | null {
  // Match URLs like .../storage/v1/object/public/bucket-name/path/to/file
  const publicMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
  if (publicMatch) {
    return { bucket: publicMatch[1], path: publicMatch[2] };
  }
  // If it's just a relative path like "secret-door/files/abc.pdf", assume portfolio-images bucket
  if (!url.startsWith("http")) {
    return { bucket: "portfolio-images", path: url };
  }
  // For secret-door-private bucket URLs
  const privateMatch = url.match(/\/storage\/v1\/object\/([^/]+)\/(.+)/);
  if (privateMatch) {
    return { bucket: privateMatch[1], path: privateMatch[2] };
  }
  return null;
}
