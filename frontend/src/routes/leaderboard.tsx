import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { levelFor } from "@/lib/vibe-store";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { users, currentUser, loading } = useVibe();
  const router = useRouter();

  useEffect(() => {
  if (!loading && !currentUser) {
    router.navigate({ to: "/login" });
  }
}, [loading, currentUser, router]);

const ranked = useMemo(
  () => [...users].sort((a, b) => b.karma - a.karma),
  [users]
);

if (loading) {
      return (
          <PostSkeleton />
      );
  }

if (!currentUser) {
  return null;
}
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand shadow-glow">
            <Trophy className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Top vibers ranked by karma.
            </p>
          </div>
        </div>

        {/* Top 3 */}
        <div className="grid gap-3 sm:grid-cols-3">
          {ranked.slice(0, 3).map((user, index) => {
            const level = levelFor(user.karma);
            const medals = ["🥇", "🥈", "🥉"];

            return (
              <div
                key={user.id}
                className={cn(
                  "rounded-md border border-border bg-card p-5 text-center shadow-soft",
                  index === 0 &&
                    "sm:order-2 sm:-translate-y-2 ring-2 ring-primary/40",
                  index === 1 && "sm:order-1",
                  index === 2 && "sm:order-3"
                )}
              >
                <p className="text-4xl">{medals[index]}</p>

                <Avatar className="mx-auto mt-2 h-16 w-16 border-2 border-primary/40">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>

                <p className="mt-2 truncate font-semibold">
                  @{user.username}
                </p>

                <p className="text-xs text-muted-foreground">
                  {level.emoji} {level.name}
                </p>

                <p className="mt-1 text-2xl font-bold text-gradient-brand">
                  {user.karma}
                </p>
              </div>
            );
          })}
        </div>

        {/* Remaining Users */}
        <ol className="mt-6 divide-y divide-border rounded-md border border-border bg-card shadow-soft">
          {ranked.slice(3).map((user, index) => {
            const level = levelFor(user.karma);
            const isMe = user.id === currentUser.id;

            return (
              <li
                key={user.id}
                className={cn(
                  "flex items-center gap-3 p-4",
                  isMe && "bg-primary/5"
                )}
              >
                <span className="w-6 text-sm font-bold text-muted-foreground">
                  {index + 4}
                </span>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    @{user.username}
                    {isMe && (
                      <span className="ml-1 text-xs text-primary">(you)</span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {level.emoji} {level.name}
                  </p>
                </div>

                <p className="text-lg font-bold">{user.karma}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </AppShell>
  );
}