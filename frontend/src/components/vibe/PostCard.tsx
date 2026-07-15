import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Share2, MoreHorizontal, Flag as FlagIcon, Trash2 } from "lucide-react"; // Added Trash2
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVibe } from "@/lib/vibe-context";
import { CATEGORY_EMOJI } from "./LeftSidebar";
import { totalVotes, commentCount, type Post } from "@/lib/vibe-store";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "./ReportDialog";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // AlertDialogTrigger is not needed here anymore
} from "@/components/ui/alert-dialog";

export function PostCard({ post, showFullDescription = false }: { post: Post; showFullDescription?: boolean }) {
  const { currentUser, comments, vote, reportContent, deletePost } = useVibe(); // Added deletePost
  const uid = currentUser?.id;
  
  const userVote =
      uid && post.votes.red.includes(uid) ? "red" :
          uid && post.votes.green.includes(uid) ? "green" :
              uid && post.votes.black.includes(uid) ? "black" : null;

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // New state for delete dialog

  const share = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) navigator.share({ title: post.title, url }).catch(() => {});
    else { navigator.clipboard.writeText(url); toast.success("Link copied!"); }
  };

  const flagIconBtn = (kind: "red" | "green" | "black", count: number, colorClass: string, activeBg: string, glow: string) => {
    const active = userVote === kind;
    return (
        <button
            aria-label={`${kind} flag`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!currentUser) return toast.error("Log in to vote");
              // If the user clicks on an already active flag, retract the vote by passing null
              // Otherwise, cast the new vote
              vote(post.id, active ? null : kind);
            }}
            className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1.5 transition hover:bg-muted dark:bg-white/10",
                active && activeBg
            )}
        >
          <FlagIcon
              className={cn("h-4 w-4 transition-transform dark:[filter:drop-shadow(0_0_6px_var(--fg))]", active && "scale-110 dark:[filter:drop-shadow(0_0_10px_var(--fg))]")}
              style={{ color: colorClass, fill: active ? colorClass : "transparent", ["--fg" as any]: glow }}
          />
          <span className="tabular-nums text-xs font-semibold">{count}</span>
        </button>
    );
  };

  const isAuthor = currentUser?.id === post.authorId;

  const handleDeletePost = async () => {
    const result = await deletePost(post.id);
    if (result.ok) {
      toast.success("Post deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete post.");
    }
    setIsDeleteDialogOpen(false); // Close dialog after action
  };

  return (
      <article className="relative rounded-md border border-border bg-card p-4 shadow-soft transition hover:shadow-glow sm:p-5 mb-2">
        {/* 3-dot icon moved above the header div */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isAuthor && ( // Only show Report if not the author
                <DropdownMenuItem
                    onClick={() => setIsReportDialogOpen(true)}
                >
                  <FlagIcon className="mr-2 h-4 w-4" /> Report post
                </DropdownMenuItem>
            )}
            {isAuthor && ( // Only show Delete if is the author
                <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)} // Open dialog on click
                    className="text-red-500" // Optional: style for delete
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete post
                </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <header className="mb-3 mt-1">
          <Link
              to="/profile/$username"
              params={{ username: post.authorName }}
              className="flex w-full items-center gap-3"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback>{post.authorName[0]}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold hover:underline">
                @{post.authorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </p>
            </div>

            <Badge
                variant="secondary"
                className="ml-auto self-end rounded-full"
            >
              <span className="mr-1">{CATEGORY_EMOJI[post.category]}</span>
              {post.category}
            </Badge>
          </Link>
        </header>


        <Link to="/post/$postId" params={{ postId: post.id }} className="block">
          <h2 className="text-lg font-bold leading-snug tracking-tight sm:text-xl">{post.title}</h2>
          <p className={cn("mt-2 text-sm text-muted-foreground", !showFullDescription && "line-clamp-3")}>
            {post.description}
          </p>
          {post.image && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                <img src={post.image} alt="" className="w-full object-cover" loading="lazy" />
              </div>
          )}
        </Link>



        <footer className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
          {/* First row */}
          <div className="flex items-center justify-between">
            {/* Flag buttons (left) */}
            <div className="flex items-center gap-1">
              {flagIconBtn(
                  "red",
                  post.votes.red.length,
                  "var(--red-flag)",
                  "bg-red-flag/10",
                  "rgba(239,68,68,0.9)"
              )}
              {flagIconBtn(
                  "green",
                  post.votes.green.length,
                  "var(--green-flag)",
                  "bg-green-flag/10",
                  "rgba(34,197,94,0.9)"
              )}
              {flagIconBtn(
                  "black",
                  post.votes.black.length,
                  "var(--black-flag)",
                  "bg-black-flag/10",
                  "rgba(255,255,255,0.85)"
              )}
            </div>

            {/* Comment & Share (right) */}
            <div className="flex items-center gap-1">
              <Link
                  to="/post/$postId"
                  params={{ postId: post.id }}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs hover:bg-muted hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" /> {commentCount(post.id, comments)}
              </Link>

              <button
                  onClick={share}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs hover:bg-muted hover:text-primary"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>

          {/* Second row */}
          <div className="mt-2">
    <span className="text-xs text-muted-foreground">
      {totalVotes(post)} votes
    </span>
          </div>
        </footer>

        <ReportDialog
            open={isReportDialogOpen}
            onOpenChange={setIsReportDialogOpen}
            onReport={(reason) => reportContent("post", post.id, reason)}
            type="post"
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                post and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </article>
  );
}