import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useVibe } from "@/lib/vibe-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { levelFor, totalVotes, CATEGORIES, type Category } from "@/lib/vibe-store";
import { Trophy, TrendingUp, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_EMOJI } from "./LeftSidebar";

export function RightSidebar({ activeCategory, onCategory }: {
  activeCategory?: Category | "all";
  onCategory?: (c: Category | "all") => void;
} = {}) {
  const { users, posts } = useVibe();

  const top = useMemo(
    () => [...users].sort((a, b) => b.karma - a.karma).slice(0, 5),
    [users]
  );
  const trending = useMemo(
    () => [...posts].sort((a, b) => totalVotes(b) - totalVotes(a)).slice(0, 4),
    [posts]
  );

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="fixed top-20 w-72 space-y-4 pl-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {onCategory && (
          <div className="rounded-3xl border border-border bg-card p-3 shadow-soft">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3" /> Categories
            </p>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => onCategory("all")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                  activeCategory === "all" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                )}
              >
                <Flame className="h-4 w-4" /> All Vibes
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onCategory(c)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                    activeCategory === c ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                  )}
                >
                  <span>{CATEGORY_EMOJI[c]}</span> {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Removed Top Vibers Card */}

        {/* Removed Trending Vibes Card
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Trending Vibes</h3>
          </div>
          <ul className="space-y-3">
            {trending.map((p) => (
              <li key={p.id}>
                <Link
                  to="/post/$postId"
                  params={{ postId: p.id }}
                  className="group block rounded-xl p-2 -m-2 hover:bg-muted"
                >
                  <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.category} · {totalVotes(p)} votes
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        */}
      </div>
    </aside>
  );
}