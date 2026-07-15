import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { PostCard } from "@/components/vibe/PostCard";
import { CommentThread } from "@/components/vibe/CommentThread";
import { ArrowLeft } from "lucide-react";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";

export const Route = createFileRoute("/post/$postId")({ component: PostDetail });

function PostDetail() {
  const { postId } = Route.useParams();
  const { posts, currentUser, loading } = useVibe();
  const router = useRouter();
  const post = posts.find((p) => p.id === postId);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.navigate({ to: "/login" });
    }
  }, [loading, currentUser, router]);

  if (loading) {
    return (
      <PostSkeleton />
    );
  }

  if (!currentUser) return null;
  if (!post) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="text-6xl">👻</p>
          <h1 className="mt-4 text-2xl font-bold">Post not found</h1>
          <Link to="/feed" className="mt-4 inline-block text-primary hover:underline">Back to feed</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/feed" className="inline-flex items-center mb-2 gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>
      <PostCard post={post} showFullDescription />
      <CommentThread postId={post.id} />
    </AppShell>
  );
}
