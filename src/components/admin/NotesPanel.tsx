import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, ImagePlus, ChevronDown, ChevronUp, Pencil } from "lucide-react";

interface Note {
  id: string;
  content: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
  image_url: string | null;
}

const NotesPanel = ({ userId, onUpdate }: { userId: string; onUpdate?: () => void }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmImageAction, setConfirmImageAction] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmResetScore, setConfirmResetScore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const pendingNoteId = useRef<string | null>(null);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("admin_notes")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });
    setNotes((data as Note[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const notifyUpdate = () => onUpdate?.();

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data } = await supabase
      .from("admin_notes")
      .insert({ user_id: userId, content: newNote.trim(), sort_order: notes.length })
      .select()
      .single();
    if (data) {
      setNotes((prev) => [...prev, data as Note]);
      setNewNote("");
      inputRef.current?.focus();
      notifyUpdate();
    }
  };

  const toggleDone = async (note: Note) => {
    const updated = !note.is_done;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_done: updated } : n)));
    await supabase.from("admin_notes").update({ is_done: updated }).eq("id", note.id);
    notifyUpdate();
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setConfirmDeleteId(null);
    await supabase.from("admin_notes").delete().eq("id", id);
    notifyUpdate();
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.content);
    setConfirmDeleteId(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const confirmEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setNotes((prev) => prev.map((n) => n.id === editingId ? { ...n, content: editText.trim() } : n));
    await supabase.from("admin_notes").update({ content: editText.trim() }).eq("id", editingId);
    setEditingId(null);
    notifyUpdate();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addNote();
  };

  const toggleImage = (id: string) => {
    setExpandedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const triggerImageUpload = (noteId: string) => {
    pendingNoteId.current = noteId;
    imgInputRef.current?.click();
  };

  const removeImage = async (noteId: string) => {
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, image_url: null } : n));
    await supabase.from("admin_notes").update({ image_url: null }).eq("id", noteId);
    setConfirmImageAction(null);
    notifyUpdate();
  };

  const replaceImage = (noteId: string) => {
    setConfirmImageAction(null);
    triggerImageUpload(noteId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const noteId = pendingNoteId.current;
    if (!file || !noteId) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(noteId);
    const ext = file.name.split(".").pop();
    const path = `notes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, file);
    if (upErr) { setUploading(null); return; }

    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);
    await supabase.from("admin_notes").update({ image_url: urlData.publicUrl }).eq("id", noteId);
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, image_url: urlData.publicUrl } : n));
    setExpandedImages((prev) => new Set(prev).add(noteId));
    setUploading(null);
    if (imgInputRef.current) imgInputRef.current.value = "";
    notifyUpdate();
  };

  const doneCount = notes.filter((n) => n.is_done).length;
  const [confirmResetScore, setConfirmResetScore] = useState(false);

  const resetScore = async () => {
    const doneIds = notes.filter((n) => n.is_done).map((n) => n.id);
    if (doneIds.length === 0) return;
    // Mark all done tasks as not done (un-check them)
    setNotes((prev) => prev.map((n) => n.is_done ? { ...n, is_done: false } : n));
    for (const id of doneIds) {
      await supabase.from("admin_notes").update({ is_done: false }).eq("id", id);
    }
    setConfirmResetScore(false);
    notifyUpdate();
  };

  return (
    <div className="w-80 max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
          Notes & To-Do
        </h3>
        {doneCount > 0 && (
          <div className="flex items-center gap-1.5">
            {confirmResetScore ? (
              <span className="flex items-center gap-1">
                <span className="text-[9px] font-display tracking-wider text-muted-foreground">Reset?</span>
                <button
                  onClick={resetScore}
                  className="text-[9px] font-display tracking-wider text-destructive hover:text-destructive/80 transition-colors"
                >
                  YES
                </button>
                <span className="text-[9px] text-muted-foreground/40">/</span>
                <button
                  onClick={() => setConfirmResetScore(false)}
                  className="text-[9px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  NO
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmResetScore(true)}
                className="flex items-center gap-1 text-[10px] font-display tracking-wider text-green-400/80 hover:text-green-300 transition-colors"
                title="Reset completed score"
              >
                <span>✓</span>
                <span>{doneCount}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 mb-3 pr-1 max-h-[50vh]">
          {notes.length === 0 && (
            <p className="text-muted-foreground text-[10px] text-center py-4 font-display tracking-wider">
              No notes yet
            </p>
          )}
          {notes.map((note) => (
            <div key={note.id} className="group">
              <div className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors">
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
                {editingId === note.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className="flex-1 bg-transparent text-xs font-display text-foreground outline-none border-b border-foreground/30 tracking-wider"
                    />
                    <button onClick={confirmEdit} className="text-[9px] font-display tracking-wider text-green-400 hover:text-green-300 transition-colors">YES</button>
                    <span className="text-[9px] text-muted-foreground/40">/</span>
                    <button onClick={cancelEdit} className="text-[9px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors">NO</button>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-display flex-1 leading-relaxed ${
                      note.is_done
                        ? "line-through text-muted-foreground/50"
                        : "text-foreground/80"
                    }`}
                  >
                    {note.content}
                  </span>
                )}

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {/* Edit button */}
                  {editingId !== note.id && (
                    <button
                      onClick={() => startEdit(note)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                      title="Edit"
                    >
                      <Pencil size={10} />
                    </button>
                  )}
                  {uploading === note.id ? (
                    <Loader2 size={10} className="animate-spin text-muted-foreground" />
                  ) : (
                    <button
                      onClick={() => triggerImageUpload(note.id)}
                      className={`transition-all ${
                        note.image_url
                          ? "text-yellow-500/70 hover:text-yellow-400"
                          : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                      }`}
                      title="Attach image"
                    >
                      <ImagePlus size={11} />
                    </button>
                  )}

                  {/* Expand/collapse image */}
                  {note.image_url && (
                    <button
                      onClick={() => toggleImage(note.id)}
                      className="text-muted-foreground/60 hover:text-foreground transition-colors"
                      title={expandedImages.has(note.id) ? "Collapse" : "Expand"}
                    >
                      {expandedImages.has(note.id) ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}

                  {/* Delete */}
                  {confirmDeleteId === note.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-[9px] font-display tracking-wider text-destructive hover:text-destructive/80 transition-colors"
                      >
                        YES
                      </button>
                      <span className="text-[9px] text-muted-foreground/40">/</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[9px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        NO
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible image */}
              {note.image_url && expandedImages.has(note.id) && (
                <div className="ml-7 mr-2 mb-1.5 mt-0.5 border border-border rounded overflow-hidden relative group/img">
                  <img
                    src={note.image_url}
                    alt=""
                    className="w-full max-h-40 object-contain bg-black/20 cursor-pointer"
                    onClick={() => window.open(note.image_url!, "_blank")}
                  />
                  {/* Hover overlay with actions */}
                  {confirmImageAction === note.id ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3">
                      <button
                        onClick={() => removeImage(note.id)}
                        className="text-[9px] font-display tracking-wider text-destructive hover:text-destructive/80 transition-colors bg-background/80 px-2 py-1 rounded"
                      >
                        DELETE
                      </button>
                      <button
                        onClick={() => replaceImage(note.id)}
                        className="text-[9px] font-display tracking-wider text-foreground hover:text-foreground/80 transition-colors bg-background/80 px-2 py-1 rounded"
                      >
                        REPLACE
                      </button>
                      <button
                        onClick={() => setConfirmImageAction(null)}
                        className="text-[9px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-background/80 px-2 py-1 rounded"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmImageAction(note.id); }}
                        className="text-[9px] font-display tracking-wider text-white/90 hover:text-white bg-black/50 px-2 py-1 rounded transition-colors"
                      >
                        EDIT IMAGE
                      </button>
                    </div>
                  )}
                </div>
              )}
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
