import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import NotesButton from "./NotesButton";

export type AdminPageKey = "main" | "portfolio" | "secret-door" | "seo" | "shop" | "visits";

const LINKS: { key: AdminPageKey; label: string; path: string }[] = [
  { key: "main", label: "Main Page CMS", path: "/admin/main" },
  { key: "portfolio", label: "Portfolio CMS", path: "/admin" },
  { key: "secret-door", label: "Secret Door", path: "/admin/secret-door" },
  { key: "seo", label: "SEO", path: "/admin/seo" },
  { key: "shop", label: "Shop", path: "/admin/shop" },
  { key: "visits", label: "Visits", path: "/admin/visits" },
];

interface Props {
  current: AdminPageKey;
  userId?: string;
  rightExtra?: ReactNode;
}

const AdminTopNav = ({ current, userId, rightExtra }: Props) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top row: Notes (left) — Site / extras (right) */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-8 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {userId && <NotesButton userId={userId} />}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          {rightExtra}
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground text-[10px] tracking-widest hover:text-foreground transition-colors font-display uppercase"
          >
            ← SITE
          </button>
        </div>
      </div>

      {/* Centered nav row — wraps cleanly on mobile/tablet */}
      <nav className="flex items-center justify-center flex-wrap gap-x-2 gap-y-2 px-3 sm:px-8 pb-3 sm:pb-4">
        {LINKS.map((link, i) => {
          const isCurrent = link.key === current;
          return (
            <div key={link.key} className="flex items-center gap-x-2">
              {i > 0 && (
                <span className="text-muted-foreground/40 hidden sm:inline">|</span>
              )}
              {isCurrent ? (
                <h1 className="font-display text-[11px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase text-foreground">
                  {link.label}
                </h1>
              ) : (
                <button
                  onClick={() => navigate(link.path)}
                  className="font-display text-[11px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
};

export default AdminTopNav;