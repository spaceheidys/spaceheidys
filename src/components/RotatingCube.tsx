import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Pencil,
  Image as ImageIcon,
  Star,
  Heart,
  Sparkles,
  Sun,
  Moon,
  Cloud,
  Zap,
  X,
  Trash2,
  Infinity as InfinityIcon,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

const ICONS = {
  none: null,
  star: Star,
  heart: Heart,
  sparkles: Sparkles,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  zap: Zap,
} as const;

type IconKey = keyof typeof ICONS;

type FaceContent = {
  title: string;
  text: string;
  image: string | null;
  icon: IconKey;
  imageScale?: number;
  imageX?: number;
  imageY?: number;
};

const FACE_TRANSFORMS = [
  "rotateY(0deg)",
  "rotateY(90deg)",
  "rotateY(180deg)",
  "rotateY(-90deg)",
  "rotateX(90deg)",
  "rotateX(-90deg)",
];
const FACE_NAMES = ["Front", "Right", "Back", "Left", "Top", "Bottom"];
const LABELS = ["01", "02", "03", "04", "05", "06"];

const DEFAULT_FACES: FaceContent[] = FACE_NAMES.map((title) => ({
  title,
  text: "",
  image: null,
  icon: "none" as IconKey,
}));

const STORAGE_KEY = "cube-faces-v2";
const SIZE = 280;
const HALF = SIZE / 2;

const RotatingCube = () => {
  const [yawDeg, setYawDeg] = useState(-30);
  const [pitchDeg, setPitchDeg] = useState(25);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    samples: { x: number; y: number; t: number }[];
  } | null>(null);
  const inertiaRef = useRef<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [faces, setFaces] = useState<FaceContent[]>(DEFAULT_FACES);
  const [editing, setEditing] = useState(false);
  const [freeSpin, setFreeSpin] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const freeSpinRef = useRef(freeSpin);
  useEffect(() => {
    freeSpinRef.current = freeSpin;
  }, [freeSpin]);

  const setYaw = (fn: (s: number) => number) => {
    cancelInertia();
    setYawDeg((d) => fn(Math.round(d / 90)) * 90);
  };
  const setPitch = (fn: (s: number) => number) => {
    cancelInertia();
    setPitchDeg((d) => fn(Math.round(d / 90)) * 90);
  };

  const cancelInertia = () => {
    if (inertiaRef.current != null) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
    setSpinning(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    cancelInertia();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const t = performance.now();
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: yawDeg,
      pitch: pitchDeg,
      samples: [{ x: e.clientX, y: e.clientY, t }],
    };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const t = performance.now();
    d.samples.push({ x: e.clientX, y: e.clientY, t });
    while (d.samples.length > 2 && t - d.samples[0].t > 100) d.samples.shift();
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    setYawDeg(d.yaw - dx * 0.4);
    setPitchDeg(d.pitch + dy * 0.4);
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    const last = d.samples[d.samples.length - 1];
    const first = d.samples[0];
    const span = last.t - first.t;
    const now = performance.now();
    const stale = now - last.t;
    let vx = 0;
    let vy = 0;
    if (span > 0 && stale < 80) {
      vx = (last.x - first.x) / span;
      vy = (last.y - first.y) / span;
    }
    dragRef.current = null;
    setDragging(false);

    let yawV = -vx * 16 * 0.4;
    let pitchV = vy * 16 * 0.4;
    const minSpeed = 0.05;
    const maxSpeed = 30;
    yawV = Math.max(-maxSpeed, Math.min(maxSpeed, yawV));
    pitchV = Math.max(-maxSpeed, Math.min(maxSpeed, pitchV));

    const tick = () => {
      const free = freeSpinRef.current;
      const friction = free ? 0.992 : 0.94;
      yawV *= friction;
      pitchV *= friction;
      setYawDeg((y) => y + yawV);
      setPitchDeg((p) => p + pitchV);
      if (Math.abs(yawV) < minSpeed && Math.abs(pitchV) < minSpeed) {
        inertiaRef.current = null;
        if (!free) {
          setYawDeg((y) => Math.round(y / 90) * 90);
          setPitchDeg((p) => Math.round(p / 90) * 90);
        }
        setSpinning(false);
        return;
      }
      inertiaRef.current = requestAnimationFrame(tick);
    };

    const hasMotion = Math.abs(yawV) > minSpeed || Math.abs(pitchV) > minSpeed;
    if (hasMotion) {
      setSpinning(true);
      inertiaRef.current = requestAnimationFrame(tick);
    } else if (!freeSpinRef.current) {
      setYawDeg((y) => Math.round(y / 90) * 90);
      setPitchDeg((p) => Math.round(p / 90) * 90);
    }
  };

  useEffect(() => () => cancelInertia(), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 6) setFaces(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(faces));
    } catch {}
  }, [faces]);

  const yaw = Math.round(yawDeg / 90);
  const pitch = Math.round(pitchDeg / 90);
  const pMod = ((pitch % 4) + 4) % 4;
  let activeIndex: number;
  if (pMod === 0) activeIndex = ((yaw % 4) + 4) % 4;
  else if (pMod === 1) activeIndex = 5;
  else if (pMod === 2) activeIndex = (((yaw + 2) % 4) + 4) % 4;
  else activeIndex = 4;

  const updateFace = (patch: Partial<FaceContent>) => {
    setFaces((prev) => prev.map((f, i) => (i === activeIndex ? { ...f, ...patch } : f)));
  };

  const active = faces[activeIndex];

  return (
    <div className="flex flex-col items-center gap-8 text-white">
      <header className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-display">Cube</p>
        <h1 className="text-2xl font-light">
          Face {LABELS[activeIndex]} · {active.title}
        </h1>
      </header>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setYaw((s) => s - 1)}
          aria-label="Rotate left"
          className={`h-11 w-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-opacity ${dragging || spinning ? "opacity-0 duration-200" : "opacity-100 duration-[1200ms] ease-out"}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setPitch((s) => s + 1)}
            aria-label="Rotate up"
            className={`h-11 w-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-opacity ${dragging || spinning ? "opacity-0 duration-200" : "opacity-100 duration-[1200ms] ease-out"}`}
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          <div
            className={`relative touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ width: SIZE, height: SIZE, perspective: 1200 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: "preserve-3d",
                transform: `translateZ(-${HALF}px) rotateX(${pitchDeg}deg) rotateY(${-yawDeg}deg)`,
                transition: dragging ? "none" : "transform 0.5s ease-out",
              }}
            >
              {faces.map((f, i) => {
                const Icon = ICONS[f.icon];
                return (
                  <div
                    key={i}
                    className="absolute inset-0 border border-white/20 bg-white/5 flex flex-col items-center justify-center text-white overflow-hidden p-6 text-center"
                    style={{
                      transform: `${FACE_TRANSFORMS[i]} translateZ(${HALF}px)${i === 4 || i === 5 ? " rotateZ(180deg)" : ""}`,
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {f.image ? (
                      <img
                        src={f.image}
                        alt={f.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          objectPosition: `${50 + (f.imageX ?? 0) * 50}% ${50 + (f.imageY ?? 0) * 50}%`,
                          transform: `scale(${f.imageScale ?? 1})`,
                        }}
                        draggable={false}
                      />
                    ) : null}
                    <div className="relative flex flex-col items-center gap-3">
                      {Icon ? <Icon className="h-8 w-8" strokeWidth={1.25} /> : null}
                      {!f.image && !f.text && !Icon ? (
                        <>
                          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                            {LABELS[i]}
                          </span>
                          <span className="text-lg font-light">{f.title}</span>
                        </>
                      ) : null}
                      {f.text ? (
                        <p className="text-sm font-light leading-relaxed max-w-[220px] whitespace-pre-wrap">
                          {f.text}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setPitch((s) => s - 1)}
            aria-label="Rotate down"
            className={`h-11 w-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-opacity ${dragging || spinning ? "opacity-0 duration-200" : "opacity-100 duration-[1200ms] ease-out"}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setYaw((s) => s + 1)}
          aria-label="Rotate right"
          className={`h-11 w-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-opacity ${dragging || spinning ? "opacity-0 duration-200" : "opacity-100 duration-[1200ms] ease-out"}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1.5">
        {faces.map((_, i) => (
          <span
            key={i}
            className={`h-1 w-6 transition-colors ${i === activeIndex ? "bg-white" : "bg-white/20"}`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Hide controls" : "Show controls"}
          className="h-9 w-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          {menuOpen ? <ChevronsDown className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
        </button>

        <div
          className={`flex flex-wrap items-center justify-center gap-6 overflow-hidden transition-all duration-300 ease-out ${
            menuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={() => setFreeSpin((v) => !v)}
            aria-pressed={freeSpin}
            className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] transition-colors ${
              freeSpin ? "text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <InfinityIcon className="h-3.5 w-3.5" />
            Free spin {freeSpin ? "on" : "off"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 hover:text-white transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit face {LABELS[activeIndex]}
          </button>
        </div>
      </div>

      {editing ? (
        <EditPanel
          face={active}
          label={LABELS[activeIndex]}
          onChange={updateFace}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
};

function EditPanel({
  face,
  label,
  onChange,
  onClose,
}: {
  face: FaceContent;
  label: string;
  onChange: (patch: Partial<FaceContent>) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange({ image: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black border border-white/20 text-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Editing · {label}</p>
            <h2 className="text-lg font-light mt-1">Face content</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-white/40">Title</label>
          <input
            value={face.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm font-light focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-white/40">Text</label>
          <textarea
            value={face.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={3}
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm font-light focus:outline-none focus:border-white transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/40">Icon</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ICONS) as IconKey[]).map((key) => {
              const Icon = ICONS[key];
              const selected = face.icon === key;
              return (
                <button
                  key={key}
                  onClick={() => onChange({ icon: key })}
                  className={`h-9 w-9 border flex items-center justify-center transition-colors ${
                    selected ? "border-white bg-white text-black" : "border-white/20 hover:bg-white/10"
                  }`}
                  aria-label={key}
                >
                  {Icon ? <Icon className="h-4 w-4" strokeWidth={1.5} /> : <span className="text-[10px]">none</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/40">Image</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Upload
            </button>
            {face.image ? (
              <button
                onClick={() => onChange({ image: null })}
                className="inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
          {face.image ? (
            <ImageAdjuster
              image={face.image}
              scale={face.imageScale ?? 1}
              x={face.imageX ?? 0}
              y={face.imageY ?? 0}
              onChange={(patch) => onChange(patch)}
            />
          ) : null}
        </div>

        <button
          onClick={onClose}
          className="w-full border border-white bg-white text-black py-2.5 text-xs uppercase tracking-[0.25em] hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ImageAdjuster({
  image,
  scale,
  x,
  y,
  onChange,
}: {
  image: string;
  scale: number;
  x: number;
  y: number;
  onChange: (patch: Partial<FaceContent>) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number; w: number; h: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: x,
      oy: y,
      w: rect.width,
      h: rect.height,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.w;
    const dy = (e.clientY - d.startY) / d.h;
    onChange({ imageX: d.ox + dx, imageY: d.oy + dy });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="space-y-2 mt-2">
      <div
        ref={boxRef}
        className="relative w-full aspect-square border border-white/20 overflow-hidden bg-white/5 touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={image}
          alt="adjust"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{
            objectPosition: `${50 + x * 50}% ${50 + y * 50}%`,
            transform: `scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-[0.2em] text-white/40">Zoom</label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.01}
          value={scale}
          onChange={(e) => onChange({ imageScale: Number(e.target.value) })}
          className="flex-1"
        />
        <button
          onClick={() => onChange({ imageScale: 1, imageX: 0, imageY: 0 })}
          className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default RotatingCube;