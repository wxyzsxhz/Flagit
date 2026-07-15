import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { levelFor } from "@/lib/vibe-store";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });

function LeaderboardPage() {
  const { users, currentUser, loading } = useVibe();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !currentUser) {
      router.navigate({ to: "/login" });
    }
  }, [loading, currentUser, router]);

  if (loading) {
      return (
        <AppShell>
          <PostSkeleton />
          <PostSkeleton />
        </AppShell>
      );
    }
  
    if (!currentUser) {
      return null;
    }

  const ranked = useMemo(() => [...users].sort((a, b) => b.karma - a.karma), [users]);
  if (!currentUser) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        {" "}
        {/* Added container for centering */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand shadow-glow">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top vibers ranked by karma.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {ranked.slice(0, 3).map((u, i) => {
            const lvl = levelFor(u.karma);
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div
                key={u.id}
                className={cn(
                  "rounded-md border border-border bg-card p-5 text-center shadow-soft",
                  i === 0 && "sm:order-2 sm:-translate-y-2 ring-2 ring-primary/40",
                  i === 1 && "sm:order-1",
                  i === 2 && "sm:order-3",
                )}
              >
                <p className="text-4xl">{medals[i]}</p>
                <Avatar className="mx-auto mt-2 h-16 w-16 border-2 border-primary/40">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback>{u.username[0]}</AvatarFallback>
                </Avatar>
                <p className="mt-2 truncate font-semibold">@{u.username}</p>
                <p className="text-xs text-muted-foreground">
                  {lvl.emoji} {lvl.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-gradient-brand">{u.karma}</p>
              </div>
            );
          })}
        </div>
        <ol className="mt-6 divide-y divide-border rounded-md border border-border bg-card shadow-soft">
          {ranked.slice(3).map((u, i) => {
            const lvl = levelFor(u.karma);
            const isMe = u.id === currentUser.id;
            return (
              <li key={u.id} className={cn("flex items-center gap-3 p-4", isMe && "bg-primary/5")}>
                <span className="w-6 text-sm font-bold text-muted-foreground">{i + 4}</span>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback>{u.username[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    @{u.username} {isMe && <span className="text-xs text-primary">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lvl.emoji} {lvl.name}
                  </p>
                </div>
                <p className="text-lg font-bold">{u.karma}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </AppShell>
  );
}
