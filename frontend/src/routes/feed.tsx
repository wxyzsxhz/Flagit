import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { PostCard } from "@/components/vibe/PostCard";
import { CreatePostDialog } from "@/components/vibe/CreatePostDialog";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Flag, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/vibe-store";
import { totalVotes, commentCount } from "@/lib/vibe-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/feed")({ component: FeedPage });

type Sort = "newest" | "trending";

function FeedPage() {
  const { currentUser, posts, comments, loading } = useVibe();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [creating, setCreating] = useState(false);
  const [visible, setVisible] = useState(6);
  
  useEffect(() => {
  if (!loading && !currentUser) {
    router.navigate({ to: "/" });
  }
  }, [loading, currentUser, router]);

  const filtered = useMemo(() => {
    let list = posts;
    if (category !== "all") list = list.filter((p) => p.category === category);
    const q = search.trim();
    if (q) {
      const hashMatch = q.match(/#(\S+)/);
      if (hashMatch) {
        const needle = hashMatch[1].toLowerCase();
        list = list.filter(
          (p) => p.category.toLowerCase().replace(/\s+/g, "") === needle.replace(/\s+/g, ""),
        );
      } else {
        const lower = q.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower),
        );
      }
    }
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "trending") sorted.sort((a, b) => totalVotes(b) - totalVotes(a)); // Changed to sort by most votes
    return sorted;
  }, [posts, category, search, sort, comments]);

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

  return (
    <>
      <AppShell
        onSearch={setSearch}
        search={search}
        activeCategory={category}
        onCategory={setCategory}
        showRightSidebar
      >
        <div className="flex items-center gap-3 rounded-md mb-2 border border-border bg-card p-3 shadow-soft">
          <button
            onClick={() => setCreating(true)}
            className="flex-1 rounded-full px-1.5 text-left text-sm text-muted-foreground"
          >
            Got a situation, @{currentUser.username}? Drop it…
          </button>
          <Button
            onClick={() => setCreating(true)}
            className="rounded-md gradient-brand text-white shadow-glow"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Post</span>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <Tabs value={sort} onValueChange={(v) => setSort(v as Sort)} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto rounded-md bg-transparent">
              <TabsTrigger value="newest" className="rounded-xl">
                ✨ Newest
              </TabsTrigger>
              <TabsTrigger value="trending" className="rounded-xl">
                🔥 Trending
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium hover:bg-muted lg:flex">
                  <Flag className="h-4 w-4 text-primary" /> Halls{" "}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Flag Halls</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.navigate({ to: "/hall/$flag", params: { flag: "red" } })}
                >
                  <Flag className="h-4 w-4 text-[var(--red-flag)] mr-2 var(--red-flag)" /> Red Flag Hall
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.navigate({ to: "/hall/$flag", params: { flag: "green" } })}
                >
                  <Flag className="h-4 w-4 text-[var(--green-flag)] mr-2 var(--green-flag)" />
                  Green Flag Hall
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.navigate({ to: "/hall/$flag", params: { flag: "black" } })}
                >
                  <Flag className="h-4 w-4 text-[var(--black-flag)] mr-2 var(--black-flag)" /> Black Flag Hall
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/60 py-16 text-center">
            <p className="text-6xl">🫥</p>
            <h3 className="mt-4 text-lg font-semibold">No vibes match</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different category or clear your search.
            </p>
          </div>
        ) : (
          <>
            {filtered.slice(0, visible).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {visible < filtered.length && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={() => setVisible((v) => v + 6)}
                  className="rounded-full"
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </AppShell>
      <CreatePostDialog open={creating} onOpenChange={setCreating} />
    </>
  );

}
