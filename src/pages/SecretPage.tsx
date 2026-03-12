import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { useSecretDoorFiles } from "@/hooks/useSecretDoorSettings";

const SecretPage = () => {
  const navigate = useNavigate();
  const { files, loading } = useSecretDoorFiles();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full max-w-lg"
      >
        <h1 className="text-3xl font-display tracking-widest text-foreground mb-4">SECRET ROOM</h1>
        <p className="text-foreground/60 text-sm tracking-widest mb-8">You found the secret door.</p>

        {loading ? (
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" />
        ) : files.length > 0 ? (
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Downloads
            </p>
            {files.map((f, i) => (
              <motion.a
                key={f.id}
                href={f.file_url}
                download={f.file_name}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                className="flex items-center justify-between border border-border p-3 hover:border-foreground transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Download size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">{f.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(f.file_size)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-display tracking-widest text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2">
                  DOWNLOAD
                </span>
              </motion.a>
            ))}
          </div>
        ) : null}

        <button
          onClick={() => navigate("/")}
          className="mt-8 text-xs tracking-[0.3em] uppercase text-foreground/40 hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </motion.div>
    </div>
  );
};

export default SecretPage;
