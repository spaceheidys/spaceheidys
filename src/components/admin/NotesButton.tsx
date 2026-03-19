import { useState, useEffect } from "react";
import { StickyNote } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotesPanel from "./NotesPanel";
import { supabase } from "@/integrations/supabase/client";

const NotesButton = ({ userId }: { userId: string }) => {
  const [hasPending, setHasPending] = useState(false);

  const checkPending = async () => {
    const { data } = await supabase
      .from("admin_notes")
      .select("id")
      .eq("user_id", userId)
      .eq("is_done", false)
      .limit(1);
    setHasPending((data?.length ?? 0) > 0);
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 text-xs font-display tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors ${
            hasPending
              ? "border-yellow-500/60 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
          }`}
        >
          <StickyNote size={12} />
          NOTES
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-4 border-border bg-background">
        <NotesPanel userId={userId} onUpdate={checkPending} />
      </PopoverContent>
    </Popover>
  );
};

export default NotesButton;
