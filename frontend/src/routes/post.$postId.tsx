import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { PostCard } from "@/components/vibe/PostCard";
import { CommentThread } from "@/components/vibe/CommentThread";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/post/$postId")({ component: PostDetail });

function PostDetail() {
  const { postId } = Route.useParams();
  const { posts, currentUser } = useVibe();
  const router = useRouter();
  const post = posts.find((p) => p.id === postId);

  useEffect(() => { if (!currentUser) router.navigate({ to: "/" }); }, [currentUser, router]);

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
      <Link to="/feed" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>
      <PostCard post={post} showFullDescription />
      <CommentThread postId={post.id} />
    </AppShell>
  );
}
