import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, ImagePlus, ChevronDown, ChevronUp, Pencil, Star, GripVertical, Minus, FolderOpen, Image, RotateCcw } from "lucide-react";

interface Note {
  id: string;
  content: string;
  is_done: boolean;
  is_starred: boolean;
  is_divider: boolean;
  is_deleted: boolean;
  sort_order: number;
  created_at: string;
  image_url: string | null;
  folder: number;
}

const DEFAULT_FOLDER_LABELS = ["1", "2", "3"];
const FOLDER_STORAGE_KEY = "notes-folder-labels";

const NotesPanel = ({ userId, onUpdate }: { userId: string; onUpdate?: () => void }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmImageAction, setConfirmImageAction] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [overlayImage, setOverlayImage] = useState<{ url: string; noteId: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmResetScore, setConfirmResetScore] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [collapsedDividers, setCollapsedDividers] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<Set<string>>(new Set());
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [folderLabels, setFolderLabels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FOLDER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [...DEFAULT_FOLDER_LABELS];
    } catch { return [...DEFAULT_FOLDER_LABELS]; }
  });
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null);
  const [renameText, setRenameText] = useState("");
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
    const fetched = (data as Note[]) || [];
    setNotes(fetched);
    // Auto-expand all notes that have images
    setExpandedImages(new Set(fetched.filter(n => n.image_url).map(n => n.id)));
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const notifyUpdate = () => onUpdate?.();

  const folderNotes = notes.filter((n) => n.folder === activeFolder && !n.is_deleted);
  const trashedNotes = notes.filter((n) => n.is_deleted);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data } = await supabase
      .from("admin_notes")
      .insert({ user_id: userId, content: newNote.trim(), sort_order: folderNotes.length, folder: activeFolder })
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

  const toggleStar = async (note: Note) => {
    const updated = !note.is_starred;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_starred: updated } : n)));
    await supabase.from("admin_notes").update({ is_starred: updated }).eq("id", note.id);
    notifyUpdate();
  };

  const deleteNote = async (id: string) => {
    // Soft delete - move to trash
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, is_deleted: true } : n));
    setConfirmDeleteId(null);
    await supabase.from("admin_notes").update({ is_deleted: true } as any).eq("id", id);
    notifyUpdate();
  };

  const restoreNotes = async (ids: string[]) => {
    setNotes((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, is_deleted: false } : n));
    setSelectedTrashIds(new Set());
    for (const id of ids) {
      await supabase.from("admin_notes").update({ is_deleted: false } as any).eq("id", id);
    }
    notifyUpdate();
  };

  const permanentlyDeleteNotes = async (ids: string[]) => {
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
    setSelectedTrashIds(new Set());
    setConfirmEmptyTrash(false);
    for (const id of ids) {
      await supabase.from("admin_notes").delete().eq("id", id);
    }
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

  const handleDragStart = (noteId: string) => {
    setDragId(noteId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;

    const dragIndex = sortedNotes.findIndex((n) => n.id === dragId);
    const targetIndex = sortedNotes.findIndex((n) => n.id === targetId);
    if (dragIndex === -1 || targetIndex === -1) return;

    const reordered = [...sortedNotes];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((n, i) => ({ ...n, sort_order: i }));
    setNotes((prev) => {
      const otherNotes = prev.filter((n) => n.folder !== activeFolder);
      return [...otherNotes, ...updated];
    });
    setDragId(null);

    for (const n of updated) {
      await supabase.from("admin_notes").update({ sort_order: n.sort_order }).eq("id", n.id);
    }
  };

  const handleDragEnd = () => {
    setDragId(null);
  };

  const doneCount = notes.filter((n) => n.is_done && !n.is_divider && !n.is_deleted).length;

  const resetScore = async () => {
    const doneIds = notes.filter((n) => n.is_done).map((n) => n.id);
    if (doneIds.length === 0) return;
    setNotes((prev) => prev.map((n) => n.is_done ? { ...n, is_done: false } : n));
    for (const id of doneIds) {
      await supabase.from("admin_notes").update({ is_done: false }).eq("id", id);
    }
    setConfirmResetScore(false);
    notifyUpdate();
  };

  const addDivider = async () => {
    const { data } = await supabase
      .from("admin_notes")
      .insert({ user_id: userId, content: "New Category", sort_order: folderNotes.length, is_divider: true, folder: activeFolder })
      .select()
      .single();
    if (data) {
      setNotes((prev) => [...prev, data as Note]);
      notifyUpdate();
    }
  };

  const sortedNotes = [...folderNotes].sort((a, b) => {
    if (!a.is_divider && !b.is_divider) {
      if (a.is_starred && !b.is_starred) return -1;
      if (!a.is_starred && b.is_starred) return 1;
    }
    return a.sort_order - b.sort_order;
  });

  const folderPendingCounts = folderLabels.map((_, i) =>
    notes.filter((n) => n.folder === i && !n.is_done && !n.is_divider && !n.is_deleted).length
  );

  const renderDivider = (note: Note) => (
    <div
      key={note.id}
      className={`group ${dragId === note.id ? "opacity-40" : ""}`}
      draggable
      onDragStart={() => handleDragStart(note.id)}
      onDragOver={(e) => handleDragOver(e, note.id)}
      onDrop={(e) => handleDrop(e, note.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center gap-1.5 py-2">
        <GripVertical size={10} className="flex-shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing" />
        <div className="h-[1px] flex-1 bg-border" />
        {editingId === note.id ? (
          <div className="flex items-center gap-1">
            <input
              ref={editInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="bg-transparent text-[9px] font-display text-muted-foreground outline-none border-b border-foreground/30 tracking-[0.2em] uppercase w-20 text-center"
            />
            <button onClick={confirmEdit} className="text-[8px] font-display tracking-wider text-foreground/70 hover:text-foreground transition-colors">YES</button>
            <span className="text-[8px] text-muted-foreground/40">/</span>
            <button onClick={cancelEdit} className="text-[8px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors">NO</button>
          </div>
        ) : (
          <button
            onClick={() => {
              setCollapsedDividers((prev) => {
                const next = new Set(prev);
                if (next.has(note.id)) next.delete(note.id);
                else next.add(note.id);
                return next;
              });
            }}
            className="text-[9px] font-display tracking-[0.2em] uppercase text-muted-foreground/60 px-1.5 whitespace-nowrap hover:text-muted-foreground transition-colors flex items-center gap-1"
          >
            {collapsedDividers.has(note.id) ? <ChevronDown size={9} /> : <ChevronUp size={9} />}
            {note.content}
          </button>
        )}
        <div className="h-[1px] flex-1 bg-border" />
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {editingId !== note.id && (
            <button
              onClick={() => startEdit(note)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
              title="Rename"
            >
              <Pencil size={9} />
            </button>
          )}
          {confirmDeleteId === note.id ? (
            <span className="flex items-center gap-1">
              <button onClick={() => deleteNote(note.id)} className="text-[8px] font-display tracking-wider text-destructive hover:text-destructive/80 transition-colors">YES</button>
              <span className="text-[8px] text-muted-foreground/40">/</span>
              <button onClick={() => setConfirmDeleteId(null)} className="text-[8px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors">NO</button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(note.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={9} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderNote = (note: Note) => {
    if (note.is_divider) return renderDivider(note);
    return (
    <div
      key={note.id}
      className={`group ${dragId === note.id ? "opacity-40" : ""}`}
      draggable
      onDragStart={() => handleDragStart(note.id)}
      onDragOver={(e) => handleDragOver(e, note.id)}
      onDrop={(e) => handleDrop(e, note.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-start gap-1.5 px-1.5 py-1.5 rounded hover:bg-secondary/50 transition-colors">
        <GripVertical size={10} className="mt-1 flex-shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing" />
        <button
          onClick={() => toggleStar(note)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${
            note.is_starred
              ? "text-yellow-400"
              : "opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-yellow-400"
          }`}
          title={note.is_starred ? "Unstar" : "Star"}
        >
          <Star size={10} fill={note.is_starred ? "currentColor" : "none"} />
        </button>
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
            <button onClick={confirmEdit} className="text-[9px] font-display tracking-wider text-foreground/70 hover:text-foreground transition-colors">YES</button>
            <span className="text-[9px] text-muted-foreground/40">/</span>
            <button onClick={cancelEdit} className="text-[9px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors">NO</button>
          </div>
        ) : (
          <span
            onClick={() => {
              navigator.clipboard.writeText(note.content);
            }}
            className={`text-xs font-display flex-1 leading-relaxed cursor-pointer hover:opacity-70 active:opacity-50 transition-opacity ${
              note.is_done
                ? "line-through text-muted-foreground/50"
                : "text-foreground/80"
            }`}
            title="Click to copy"
          >
            {note.content}
          </span>
        )}

        <div className="flex items-center gap-0.5 flex-shrink-0">
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
          {note.image_url && (
            <button
              onClick={() => setOverlayImage({ url: note.image_url!, noteId: note.id })}
              className="relative text-muted-foreground/60 hover:text-foreground transition-colors"
              title="Preview image"
            >
              <Image size={11} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            </button>
          )}
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

    </div>
  );
  };

  return (
    <div className="w-80 h-[45vh] min-h-[45vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          Notes & To-Do
        </button>
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
                className="flex items-center gap-1 text-[10px] font-display tracking-wider text-foreground/60 hover:text-foreground transition-colors"
                title="Reset completed score"
              >
                <span>✓</span>
                <span>{doneCount}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-0.5 mb-3 pr-1">
              {folderNotes.length === 0 && (
                <p className="text-muted-foreground text-[10px] text-center py-4 font-display tracking-wider">
                  No notes yet
                </p>
              )}
              {(() => {
                let currentDividerId: string | null = null;
                return sortedNotes.map((note) => {
                  if (note.is_divider) {
                    currentDividerId = note.id;
                    return renderNote(note);
                  }
                  if (currentDividerId && collapsedDividers.has(currentDividerId)) {
                    return null;
                  }
                  return renderNote(note);
                });
              })()}
            </div>
          )}

          {/* Input + add buttons */}
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
              title="Add note"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={addDivider}
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
              title="Add divider"
            >
              <Minus size={14} />
            </button>
          </div>

          {/* Folder tabs */}
          <div className="flex gap-1 mt-2 border-t border-border pt-2">
            {folderLabels.map((label, i) => (
              <div key={i} className="flex-1">
                {renamingFolder === i ? (
                  <div className="flex items-center gap-0.5 border border-foreground/40 py-1 px-1">
                    <input
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const updated = [...folderLabels];
                          updated[i] = renameText.trim() || DEFAULT_FOLDER_LABELS[i];
                          setFolderLabels(updated);
                          localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(updated));
                          setRenamingFolder(null);
                        }
                        if (e.key === "Escape") setRenamingFolder(null);
                      }}
                      autoFocus
                      className="w-full bg-transparent text-[9px] font-display tracking-[0.15em] uppercase text-foreground outline-none text-center"
                    />
                    <button
                      onClick={() => {
                        const updated = [...folderLabels];
                        updated[i] = renameText.trim() || DEFAULT_FOLDER_LABELS[i];
                        setFolderLabels(updated);
                        localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(updated));
                        setRenamingFolder(null);
                      }}
                      className="text-[8px] font-display tracking-wider text-foreground/70 hover:text-foreground"
                    >YES</button>
                    <span className="text-[8px] text-muted-foreground/40">/</span>
                    <button
                      onClick={() => setRenamingFolder(null)}
                      className="text-[8px] font-display tracking-wider text-muted-foreground hover:text-foreground"
                    >NO</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveFolder(i)}
                    onDoubleClick={() => { setRenamingFolder(i); setRenameText(label); }}
                    className={`w-full flex items-center justify-between px-2 text-[9px] font-display tracking-[0.15em] uppercase py-1.5 border transition-colors ${
                      activeFolder === i
                        ? "border-foreground/40 text-foreground bg-foreground/5"
                        : "border-border text-muted-foreground/50 hover:text-muted-foreground hover:border-foreground/20"
                    }`}
                    title="Double-click to rename"
                  >
                    <span className="flex items-center gap-1">
                      <FolderOpen size={9} />
                      {label}
                    </span>
                    {folderPendingCounts[i] > 0 && (
                      <span className="text-[8px] text-yellow-400">{folderPendingCounts[i]}</span>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Image overlay */}
      {overlayImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center overflow-auto p-8"
          onClick={() => { setOverlayImage(null); setConfirmImageAction(null); }}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={overlayImage.url}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded cursor-pointer"
              onClick={() => { setOverlayImage(null); setConfirmImageAction(null); }}
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {confirmImageAction === overlayImage.noteId ? (
                <>
                  <button
                    onClick={() => { removeImage(overlayImage.noteId); setOverlayImage(null); }}
                    className="text-[10px] font-display tracking-wider text-destructive bg-background/90 px-3 py-1.5 rounded transition-colors hover:bg-background"
                  >
                    DELETE
                  </button>
                  <button
                    onClick={() => { replaceImage(overlayImage.noteId); setOverlayImage(null); }}
                    className="text-[10px] font-display tracking-wider text-foreground bg-background/90 px-3 py-1.5 rounded transition-colors hover:bg-background"
                  >
                    REPLACE
                  </button>
                  <button
                    onClick={() => setConfirmImageAction(null)}
                    className="text-[10px] font-display tracking-wider text-muted-foreground bg-background/90 px-3 py-1.5 rounded transition-colors hover:bg-background"
                  >
                    CANCEL
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmImageAction(overlayImage.noteId)}
                  className="text-[10px] font-display tracking-wider text-foreground/90 bg-background/80 px-3 py-1.5 rounded transition-colors hover:bg-background"
                >
                  EDIT IMAGE
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotesPanel;