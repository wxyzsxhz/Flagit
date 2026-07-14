import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Flag, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@/lib/vibe-context";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const TYPE_ICON: Record<NotificationType, any> = {
  like_post: Heart,
  like_comment: Heart,
  reply_comment: MessageCircle,
  post_milestone: TrendingUp,
  achievement: Trophy,
};

function NotificationsPage() {
  const { currentUser, notifications, fetchNotifications, markNotificationRead, markAllNotificationsRead } = useVibe();
  const router = useRouter();

  useEffect(() => { if (!currentUser) router.navigate({ to: "/" }); }, [currentUser, router]);
  useEffect(() => { if (currentUser) fetchNotifications().catch(() => {}); }, [currentUser, fetchNotifications]);

  if (!currentUser) return null;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand shadow-glow">
            <Flag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">🔔 Notifications</h1>
            <p className="text-sm text-muted-foreground">All your recent activity in one spot.</p>
          </div>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllNotificationsRead}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card shadow-soft">
        {notifications.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-5xl">🔔</p>
            <p className="mt-3 text-sm text-muted-foreground">Nothing here yet. Activity on your posts and comments will show up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Flag;
              const content = (
                <li
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 transition hover:bg-muted/50 cursor-pointer",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </li>
              );

              return n.postId ? (
                <Link key={n.id} to="/post/$postId" params={{ postId: n.postId }}>
                  {content}
                </Link>
              ) : (
                content
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}