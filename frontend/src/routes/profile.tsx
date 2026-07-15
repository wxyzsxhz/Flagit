import { createFileRoute, useRouter, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PostCard } from "@/components/vibe/PostCard";
import { levelFor, karmaProgress } from "@/lib/vibe-store";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { Calendar, MessageSquare, FileText, Pencil } from "lucide-react"; // Added Pencil icon
import { Button } from "@/components/ui/button"; // Added Button component

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { currentUser, posts, comments, loading } = useVibe();
  const router = useRouter();

  const isOwnProfileRoute =
    router.state.location.pathname === "/profile";
  
    if (!isOwnProfileRoute) {
    return <Outlet />;
  }
  
  useEffect(() => {
    if (!loading && !currentUser) {
      router.navigate({ to: "/login" });
    }
  }, [loading, currentUser, router]);

  const myPosts = useMemo(
    () => currentUser ? posts.filter((p) => p.authorId === currentUser.id).sort((a, b) => b.createdAt - a.createdAt) : [],
    [posts, currentUser]
  );
  const myCommentCount = useMemo(
    () => currentUser ? comments.filter((c) => c.authorId === currentUser.id).length : 0,
    [comments, currentUser]
  );

  if (loading) {
      return (
          <PostSkeleton />
      );
  }

  if (!currentUser) {
    return null;
  }

  const lvl = levelFor(currentUser.karma);
  const prog = karmaProgress(currentUser.karma);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
          <div className="h-28 gradient-brand" />
          <div className="p-6">
            <div className="-mt-16 flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold break-words">@{currentUser.username}</h1> {/* Added break-words */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.navigate({ to: "/edit-profile" })}
                    className="h-6 w-6"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{lvl.emoji} {lvl.name}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-2xl font-bold text-gradient-brand">{currentUser.karma}</p>
                <p className="text-xs text-muted-foreground">Karma</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-2xl font-bold">{myPosts.length}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><FileText className="h-3 w-3" /> Posts</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-2xl font-bold">{myCommentCount}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><MessageSquare className="h-3 w-3" /> Comments</p>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to next level</span>
                <span className="font-semibold">{prog.span ? `${prog.current}/${prog.span}` : "Maxed out 🎉"}</span>
              </div>
              <Progress value={prog.pct} className="h-2" />
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> Joined {new Date(currentUser.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold">Your posts</h2>
          {myPosts.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card/60 py-12 text-center">
              <p className="text-5xl">🫧</p>
              <p className="mt-3 text-sm text-muted-foreground">No posts yet. Drop your first situation from the feed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPosts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}