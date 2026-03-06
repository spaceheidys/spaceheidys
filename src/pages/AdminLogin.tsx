import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/admin");
      }
    }
    setSubmitting(false);
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
          {isSignUp ? "SIGN UP" : "ADMIN LOGIN"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="bg-secondary border border-border text-foreground text-sm tracking-widest font-display px-4 py-3 outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="bg-secondary border border-border text-foreground text-sm tracking-widest font-display px-4 py-3 outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-foreground text-background font-display text-xs tracking-[0.3em] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "..." : isSignUp ? "SIGN UP" : "LOGIN"}
          </button>
        </form>

        <p className="text-muted-foreground text-xs text-center mt-6 font-display tracking-wider">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-foreground hover:underline"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>

        <button
          onClick={() => navigate("/")}
          className="block mx-auto mt-4 text-muted-foreground text-xs tracking-widest hover:text-foreground transition-colors font-display"
        >
          ← BACK
        </button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
