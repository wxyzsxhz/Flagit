import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PostCard } from "@/components/vibe/PostCard";
import { levelFor, karmaProgress } from "@/lib/vibe-store";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { Calendar, MessageSquare, FileText } from "lucide-react";

export const Route = createFileRoute("/profile/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { users, posts, comments, currentUser, loading } = useVibe();
  const router = useRouter();

  const profileUser = useMemo(
  () =>
    users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    ),
  [users, username]
);

  const userPosts = useMemo(
    () => profileUser ? posts.filter((p) => p.authorId === profileUser.id).sort((a, b) => b.createdAt - a.createdAt) : [],
    [posts, profileUser]
  );

  const userCommentCount = useMemo(
    () => profileUser ? comments.filter((c) => c.authorId === profileUser.id).length : 0,
    [comments, profileUser]
  );

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

  if (!profileUser) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">
          User @{username} not found.
        </div>
      </AppShell>
    );
  }

  const lvl = levelFor(profileUser.karma);
  const prog = karmaProgress(profileUser.karma);

  console.log({
  urlUsername: username,
  profileUser,
  currentUser
});

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="h-28 gradient-brand" />
          <div className="p-6">
            <div className="-mt-16 flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback>{profileUser.username[0]}</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <h1 className="text-2xl font-bold break-words">@{profileUser.username}</h1> {/* Added break-words */}
                <p className="text-sm text-muted-foreground">{lvl.emoji} {lvl.name}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-2xl font-bold text-gradient-brand">{profileUser.karma}</p>
                <p className="text-xs text-muted-foreground">Karma</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-2xl font-bold">{userPosts.length}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><FileText className="h-3 w-3" /> Posts</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-2xl font-bold">{userCommentCount}</p>
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
              <Calendar className="h-3 w-3" /> Joined {new Date(profileUser.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold">@{profileUser.username}'s posts</h2>
          {userPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 py-12 text-center">
              <p className="text-5xl">🫧</p>
              <p className="mt-3 text-sm text-muted-foreground">No posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}