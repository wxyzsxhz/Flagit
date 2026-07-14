import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVibe } from "@/lib/vibe-context";
import { REACTIONS, type Comment, type ReactionKey } from "@/lib/vibe-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Reply, Pencil, Trash2, Flag as FlagIcon } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ReportDialog } from "./ReportDialog"; // Import ReportDialog

function CommentNode({
  comment,
  rootId,
  isReply = false,
}: {
  comment: Comment;
  rootId: string;
  isReply?: boolean;
}) {
  const { currentUser, addComment, editComment, deleteComment, toggleReaction, reportContent } = useVibe();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false); // State for report dialog

  const isOwner = currentUser?.id === comment.authorId;

  const submitReply = async () => {
    if (replyText.trim().length < 2) return;
    // Facebook-style: all replies flatten under the ROOT comment.
    // Note: no @authorName prefix here — mentioning another user isn't
    // allowed in post/comment content, and the API rejects it outright.
    const res = await addComment(comment.postId, replyText, rootId);
    if (!res.ok) return toast.error(res.error ?? "Couldn't reply.");
    setReplyText(""); setReplying(false);
  };

  const submitEdit = () => {
    if (editText.trim().length < 2) return;
    editComment(comment.id, editText);
    setEditing(false);
  };

  const userReaction = currentUser
    ? (Object.entries(comment.reactions).find(([, ids]) => ids.includes(currentUser.id))?.[0] as ReactionKey | undefined)
    : undefined;

  return (
    <div className={cn("flex gap-3", isReply && "mt-3")}>
      <Avatar className={cn("shrink-0", isReply ? "h-7 w-7" : "h-8 w-8")}>
        <AvatarImage src={comment.authorAvatar} />
        <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl bg-muted/60 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 text-xs">
            <span className="font-semibold">@{comment.authorName}</span>
            <span className="text-muted-foreground">· {formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
            {comment.editedAt && <span className="text-muted-foreground">(edited)</span>}
          </div>
          {editing ? (
            <div className="mt-1 space-y-2">
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={submitEdit}>Save</Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-full px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                {userReaction ? REACTIONS.find(r => r.key === userReaction)?.emoji : "😊"} React
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-full border-border p-1">
              <div className="flex gap-0.5">
                {REACTIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { if (!currentUser) return toast.error("Log in to react"); toggleReaction(comment.id, r.key); }}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full text-lg transition hover:scale-125",
                      userReaction === r.key && "bg-primary/20"
                    )}
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {REACTIONS.filter((r) => comment.reactions[r.key].length > 0).map((r) => (
            <button
              key={r.key}
              onClick={() => { if (!currentUser) return toast.error("Log in to react"); toggleReaction(comment.id, r.key); }}
              className={cn(
                "flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 hover:bg-muted",
                userReaction === r.key && "border-primary/40 bg-primary/10"
              )}
            >
              <span>{r.emoji}</span>
              <span className="tabular-nums">{comment.reactions[r.key].length}</span>
            </button>
          ))}

          <button onClick={() => setReplying((v) => !v)} className="ml-1 flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Reply className="h-3 w-3" /> Reply
          </button>
          {isOwner && (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button onClick={() => { if (confirm("Delete comment?")) deleteComment(comment.id); }} className="flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </>
          )}
          {!isOwner && (
            <button
              onClick={() => setIsReportDialogOpen(true)} // Open report dialog
              className="flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <FlagIcon className="h-3 w-3" /> Report
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 space-y-2">
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Reply to @${comment.authorName}...`} rows={2} />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setReplying(false); setReplyText(""); }}>Cancel</Button>
              <Button size="sm" onClick={submitReply} className="gradient-brand text-white">Reply</Button>
            </div>
          </div>
        )}
      </div>

      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        onReport={(reason) => reportContent("comment", comment.id, reason)}
        type="comment"
      />
    </div>
  );
}

export function CommentThread({ postId }: { postId: string }) {
  const { comments, currentUser, addComment } = useVibe();
  const [text, setText] = useState("");

  const roots = useMemo(
    () => comments.filter((c) => c.postId === postId && c.parentId === null)
      .sort((a, b) => b.createdAt - a.createdAt),
    [comments, postId]
  );
  // For each root, collect ALL descendants (flattened into a single thread)
  const repliesByRoot = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const root of roots) {
      const all = comments
        .filter((c) => c.postId === postId && c.parentId !== null)
        .filter((c) => {
          // walk up parents to find root
          let cur: Comment | undefined = c;
          const seen = new Set<string>();
          while (cur && cur.parentId && !seen.has(cur.id)) {
            seen.add(cur.id);
            if (cur.parentId === root.id) return true;
            cur = comments.find((x) => x.id === cur!.parentId);
          }
          return false;
        })
        .sort((a, b) => a.createdAt - b.createdAt);
      map.set(root.id, all);
    }
    return map;
  }, [comments, roots, postId]);

  const totalCount = useMemo(() => comments.filter((c) => c.postId === postId).length, [comments, postId]);

  const submit = async () => {
    if (!currentUser) return toast.error("Log in to comment");
    if (text.trim().length < 2) return;
    const res = await addComment(postId, text);
    if (!res.ok) return toast.error(res.error ?? "Couldn't comment.");
    setText("");
  };

  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
      <h3 className="mb-3 text-lg font-bold">Comments ({totalCount})</h3>
      {currentUser ? (
        <div className="mb-5 flex gap-3">
          <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={currentUser.avatar} /><AvatarFallback>{currentUser.username[0]}</AvatarFallback></Avatar>
          <div className="flex-1 space-y-2">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your thoughts…" rows={2} />
            <div className="flex justify-end">
              <Button size="sm" onClick={submit} className="rounded-full gradient-brand text-white">Comment</Button>
            </div>
          </div>
        </div>
      ) : null}

      {roots.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-2 text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {roots.map((c) => {
            const replies = repliesByRoot.get(c.id) ?? [];
            return (
              <div key={c.id}>
                <CommentNode comment={c} rootId={c.id} />
                {replies.length > 0 && (
                  <div className="mt-3 space-y-3 border-l border-border pl-3 ml-4 sm:ml-6">
                    {replies.map((r) => (
                      <CommentNode key={r.id} comment={r} rootId={c.id} isReply />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}