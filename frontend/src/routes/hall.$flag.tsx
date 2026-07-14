import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { PostCard } from "@/components/vibe/PostCard";
import { Flag as FlagIcon } from "lucide-react";

export const Route = createFileRoute("/hall/$flag")({ component: HallPage });

const META: Record<string, { title: string; sub: string; color: string; key: "red" | "green" | "black" }> = {
  red: { title: "Red Flag Hall", sub: "Top-voted red flags of all time.", color: "var(--red-flag)", key: "red" },
  green: { title: "Green Flag Zone", sub: "The wholesome hall of fame.", color: "var(--green-flag)", key: "green" },
  black: { title: "Black Flag Archive", sub: "The wildest cases, archived.", color: "var(--black-flag)", key: "black" },
};

function HallPage() {
  const { flag } = Route.useParams();
  const meta = META[flag] ?? META.red;
  const { currentUser, posts } = useVibe();
  const router = useRouter();
  useEffect(() => { if (!currentUser) router.navigate({ to: "/" }); }, [currentUser, router]);

  const list = useMemo(
    () => [...posts].sort((a, b) => b.votes[meta.key].length - a.votes[meta.key].length).slice(0, 20),
    [posts, meta.key]
  );

  if (!currentUser) return null;

  return (
    <AppShell>
      <div className="flex items-center gap-3 rounded-md border border-border bg-card mb-2 p-4 shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${meta.color} 15%, transparent)` }}>
          <FlagIcon className="h-6 w-6" style={{ color: meta.color, fill: meta.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">{meta.sub}</p>
        </div>
      </div>
      {list.map((p) => <PostCard key={p.id} post={p} />)}
    </AppShell>
  );
}
