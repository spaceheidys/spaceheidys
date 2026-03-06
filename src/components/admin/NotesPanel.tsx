import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Note {
  id: string;
  content: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
}

const NotesPanel = ({ userId }: { userId: string }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("admin_notes" as any)
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });
    setNotes((data as any as Note[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data } = await supabase
      .from("admin_notes" as any)
      .insert({ user_id: userId, content: newNote.trim(), sort_order: notes.length } as any)
      .select()
      .single();
    if (data) {
      setNotes((prev) => [...prev, data as any as Note]);
      setNewNote("");
      inputRef.current?.focus();
    }
  };

  const toggleDone = async (note: Note) => {
    const updated = !note.is_done;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_done: updated } : n)));
    await supabase.from("admin_notes" as any).update({ is_done: updated } as any).eq("id", note.id);
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("admin_notes" as any).delete().eq("id", id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addNote();
  };

  return (
    <div className="w-80 max-h-[70vh] flex flex-col">
      <h3 className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground mb-3">
        Notes & To-Do
      </h3>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 mb-3 pr-1 max-h-[50vh]">
          {notes.length === 0 && (
            <p className="text-muted-foreground text-[10px] text-center py-4 font-display tracking-wider">
              No notes yet
            </p>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-2 group px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors"
            >
              <button
                onClick={() => toggleDone(note)}
                className={`mt-0.5 w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-colors ${
                  note.is_done
                    ? "border-foreground/40 bg-foreground/10"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                {note.is_done && (
                  <span className="text-[8px] text-foreground/60">✓</span>
                )}
              </button>
              <span
                className={`text-xs font-display flex-1 leading-relaxed ${
                  note.is_done
                    ? "line-through text-muted-foreground/50"
                    : "text-foreground/80"
                }`}
              >
                {note.content}
              </span>
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 border-t border-border pt-3">
        <input
          ref={inputRef}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note..."
          className="flex-1 bg-transparent text-xs font-display text-foreground placeholder:text-muted-foreground/50 outline-none tracking-wider"
        />
        <button
          onClick={addNote}
          disabled={!newNote.trim()}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotesPanel;
