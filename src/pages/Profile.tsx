import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Profile = () => {
  const { profile, user, loading, saving, error, updateUsername } = useProfile();
  const [username, setUsername] = useState("");
  const [edited, setEdited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-sm tracking-widest font-display uppercase">
          Not authenticated
        </p>
        <button
          onClick={() => navigate("/admin/login")}
          className="text-foreground text-xs tracking-[0.3em] uppercase hover:underline font-display"
        >
          Login →
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const result = await updateUsername(trimmed);
    if (result.success) {
      toast.success("Username saved");
      setEdited(false);
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-foreground font-display text-xl tracking-[0.3em] uppercase text-center mb-8">
          Profile
        </h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-muted-foreground text-xs tracking-widest font-display uppercase block mb-1.5">
              Email
            </label>
            <p className="text-foreground text-sm tracking-widest font-display bg-secondary border border-border px-4 py-3">
              {profile?.email || user.email || "—"}
            </p>
          </div>

          <div>
            <label className="text-muted-foreground text-xs tracking-widest font-display uppercase block mb-1.5">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setEdited(true);
              }}
              className="w-full bg-secondary border border-border text-foreground text-sm tracking-widest font-display px-4 py-3 outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground"
              placeholder="username"
            />
          </div>

          {error && (
            <p className="text-destructive text-xs tracking-wider font-display">
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !edited || !username.trim()}
            className="bg-foreground text-background font-display text-xs tracking-[0.3em] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="block mx-auto mt-6 text-muted-foreground text-xs tracking-widest hover:text-foreground transition-colors font-display"
        >
          ← Back
        </button>
      </motion.div>
    </div>
  );
};

export default Profile;
