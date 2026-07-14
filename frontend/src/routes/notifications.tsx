import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Flag, Trophy, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router"; // Import Link

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

type NotifType = "like" | "reply" | "milestone" | "flag" | "trending" | "achievement";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body?: string;
  ago: string;
  read?: boolean;
  avatar?: string;
  postId?: string; // Added postId for redirection
}

const NOTIFS: Notif[] = [
  { id: "n1", type: "trending", title: "🔥 Your post is trending", body: "\"My boss wants us to install monitoring software…\"", ago: "5 mins ago", postId: "p1" }, // Example postId
  { id: "n2", type: "reply", title: "💬 Anon#4521 replied", body: "\"That's definitely a red flag\"", ago: "1 hour ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anon4521", postId: "p2" }, // Example postId
  { id: "n3", type: "like", title: "❤️ Someone liked your comment", body: "\"Run. Not walk. Run. 🚩🚩🚩\"", ago: "2 hours ago", postId: "p3" }, // Example postId
  { id: "n4", type: "milestone", title: "📊 Your post reached 1k votes", body: "You're on fire this week.", ago: "5 hours ago", read: true, postId: "p4" }, // Example postId
  { id: "n5", type: "flag", title: "🚩 Your post is now 80% Red Flag", body: "The community has spoken.", ago: "8 hours ago", read: true, postId: "p5" }, // Example postId
  { id: "n6", type: "achievement", title: "🏆 Congratulations! You unlocked \"Flag Detective\"", body: "100 helpful votes", ago: "yesterday", read: true },
];

const TYPE_ICON: Record<NotifType, any> = {
  like: Heart, reply: MessageCircle, milestone: TrendingUp, flag: Flag, trending: Sparkles, achievement: Trophy,
};

function NotificationsPage() {
  const { currentUser } = useVibe();
  const router = useRouter();
  useEffect(() => { if (!currentUser) router.navigate({ to: "/" }); }, [currentUser, router]);
  if (!currentUser) return null;

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand shadow-glow">
          <Flag className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">🔔 Notifications</h1>
          <p className="text-sm text-muted-foreground">All your recent activity in one spot.</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {NOTIFS.map((n) => {
            const Icon = TYPE_ICON[n.type];
            const content = (
              <li key={n.id} className={cn(
                "flex items-start gap-3 p-4 transition hover:bg-muted/50",
                !n.read && "bg-primary/5"
              )}>
                {n.avatar ? (
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={n.avatar} />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{n.ago}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </li>
            );

            if (n.postId) {
              return (
                <Link key={n.id} to="/post/$postId" params={{ postId: n.postId }}>
                  {content}
                </Link>
              );
            }
            return content;
          })}
        </ul>
      </div>
    </AppShell>
  );
}