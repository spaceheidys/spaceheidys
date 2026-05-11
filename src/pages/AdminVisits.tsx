import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminTopNav from "@/components/admin/AdminTopNav";

type VisitLog = {
  id: string;
  visitor_hash: string;
  country: string | null;
  country_name: string | null;
  city: string | null;
  region: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  path: string | null;
  created_at: string;
};

type Range = "24h" | "7d" | "30d" | "all";

const RANGE_LABEL: Record<Range, string> = {
  "24h": "Last 24h",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const flagOf = (cc: string | null) => {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => A + c.charCodeAt(0) - 65));
};

const AdminVisits = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate]);

  const sinceISO = useMemo(() => {
    if (range === "all") return null;
    const d = new Date();
    const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
    d.setHours(d.getHours() - hours);
    return d.toISOString();
  }, [range]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("visit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (sinceISO) q = q.gte("created_at", sinceISO);
      const { data, error } = await q;
      if (!cancelled) {
        if (error) toast.error("Failed to load visits");
        setLogs((data ?? []) as VisitLog[]);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAdmin, sinceISO]);

  const stats = useMemo(() => {
    const total = logs.length;
    const uniqueHashes = new Set(logs.map((l) => l.visitor_hash));
    const unique = uniqueHashes.size;

    const tally = <K extends keyof VisitLog>(key: K) => {
      const map = new Map<string, number>();
      logs.forEach((l) => {
        const v = (l[key] ?? "—") as string;
        map.set(v, (map.get(v) ?? 0) + 1);
      });
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      total,
      unique,
      countries: tally("country_name"),
      devices: tally("device"),
      browsers: tally("browser"),
      os: tally("os"),
      referrers: tally("referrer"),
      paths: tally("path"),
    };
  }, [logs]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-foreground/40 animate-spin" />
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminTopNav current="visits" userId={user?.id} />

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Range selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-[10px] font-display tracking-widest uppercase border transition-colors ${
                range === r
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>

        {/* Privacy note */}
        <div className="border border-border p-3 text-[11px] text-muted-foreground font-body leading-relaxed">
          <span className="text-foreground font-display tracking-widest uppercase text-[10px]">Privacy</span>
          <p className="mt-1">
            No IP addresses are stored. Visitors are counted via an anonymous one-way daily hash that
            cannot be reversed. Country / city is derived from the IP at request time and stored coarsely.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
          </div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total visits" value={stats.total} />
              <StatCard label="Unique visitors" value={stats.unique} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ListCard title="Countries" rows={stats.countries} render={(k) => {
                const log = logs.find((l) => (l.country_name ?? "—") === k);
                return (
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{flagOf(log?.country ?? null)}</span>
                    <span>{k}</span>
                  </span>
                );
              }} />
              <ListCard title="Referrers" rows={stats.referrers} render={(k) => k === "—" ? "Direct" : k} />
              <ListCard title="Devices" rows={stats.devices} />
              <ListCard title="Browsers" rows={stats.browsers} />
              <ListCard title="OS" rows={stats.os} />
              <ListCard title="Paths" rows={stats.paths} />
            </div>

            {/* Recent visits */}
            <section className="border border-border">
              <h2 className="font-display text-xs tracking-[0.3em] uppercase px-3 py-2 border-b border-border">
                Recent visits ({Math.min(logs.length, 100)})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-body">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">When</th>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">Country</th>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">City</th>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">Device</th>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">Browser</th>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">Path</th>
                      <th className="text-left px-3 py-2 font-display tracking-widest uppercase text-[10px]">From</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 100).map((l) => (
                      <tr key={l.id} className="border-b border-border/40">
                        <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <span className="mr-1">{flagOf(l.country)}</span>{l.country_name ?? "—"}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{l.city ?? "—"}</td>
                        <td className="px-3 py-1.5">{l.device ?? "—"}</td>
                        <td className="px-3 py-1.5">{l.browser ?? "—"}</td>
                        <td className="px-3 py-1.5 truncate max-w-[140px]">{l.path ?? "—"}</td>
                        <td className="px-3 py-1.5 truncate max-w-[140px]">{l.referrer ?? "Direct"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="border border-border p-4">
    <div className="text-[10px] font-display tracking-widest uppercase text-muted-foreground">{label}</div>
    <div className="font-display text-3xl text-foreground tabular-nums mt-1">{value.toLocaleString("en-US")}</div>
  </div>
);

const ListCard = ({
  title,
  rows,
  render,
}: {
  title: string;
  rows: [string, number][];
  render?: (key: string) => React.ReactNode;
}) => {
  const max = rows[0]?.[1] ?? 1;
  return (
    <section className="border border-border p-3">
      <h3 className="font-display text-[11px] tracking-[0.3em] uppercase text-foreground mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No data</p>
      ) : (
        <ul className="space-y-1">
          {rows.slice(0, 8).map(([k, v]) => (
            <li key={k} className="text-[11px] flex items-center gap-2">
              <span className="flex-1 truncate text-foreground">{render ? render(k) : k}</span>
              <span className="w-20 h-1 bg-border relative overflow-hidden">
                <span
                  className="absolute inset-y-0 left-0 bg-foreground/70"
                  style={{ width: `${(v / max) * 100}%` }}
                />
              </span>
              <span className="text-muted-foreground tabular-nums w-10 text-right">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminVisits;