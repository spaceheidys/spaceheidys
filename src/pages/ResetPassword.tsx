import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });
    supabase.auth.getUser().then(({ data, error }) => {
      if (recoveryLink && data.user && !error) setReady(true);
    }).finally(() => setChecking(false));
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || submitting) return;
    if (password !== confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      await supabase.auth.signOut();
      toast.success("Password updated. Sign in with your new password.");
      navigate("/admin/login", { replace: true });
    } catch {
      toast.error("Could not update your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="min-h-[100svh] bg-background flex items-center justify-center px-4">
    <div className="w-full max-w-sm">
      <h1 className="text-foreground font-display text-xl uppercase text-center mb-8">NEW PASSWORD</h1>
      {checking ? <p className="text-muted-foreground text-center">Checking reset link…</p> : !ready ? <div className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">This reset link is missing, invalid, or expired. Request a new link.</p>
        <Button asChild variant="link"><Link to="/admin/login">Back to login</Link></Button>
      </div> : <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="password" aria-label="New password" placeholder="New password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary border border-border text-foreground text-sm font-display px-4 py-3" />
        <input type="password" aria-label="Confirm new password" placeholder="Confirm new password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={e => setConfirmation(e.target.value)} className="bg-secondary border border-border text-foreground text-sm font-display px-4 py-3" />
        <Button type="submit" disabled={submitting} className="font-display uppercase">{submitting ? "..." : "Save password"}</Button>
      </form>}
    </div>
  </main>;
};

export default ResetPassword;