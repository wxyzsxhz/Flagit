import { Link, useRouter } from "@tanstack/react-router";
import { Home, User as UserIcon, Trophy, Bell, LogOut } from "lucide-react";
import { useVibe } from "@/lib/vibe-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { levelFor, karmaProgress, type Category } from "@/lib/vibe-store";

const CATEGORY_EMOJI: Record<Category, string> = {
  Relationship: "💘",
  Work: "💼",
  School: "🎓",
  Family: "🏠",
  Friends: "🫂",
  Lifestyle: "✨",
  Finance: "💸",
  "Social Media": "📱",
  Gaming: "🎮",
  Others: "🌀",
};

// Prototype: pretend there's always 1 unread notification
const HAS_NEW_NOTIFS = true;

export function LeftSidebar() {
  const { currentUser, logout } = useVibe();
  const router = useRouter();
  const path = router.state.location.pathname;
  const lvl = currentUser ? levelFor(currentUser.karma) : null;
  const prog = currentUser ? karmaProgress(currentUser.karma) : null;

  const navItem = (to: string, label: string, Icon: any, badge = false) => {
    const active = path === to;
    return (
      <Link
        to={to}
        className={cn(
          "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
          active ? "gradient-brand text-white shadow-glow" : "hover:bg-muted"
        )}
      >
        <span className="relative">
          <Icon className="h-4 w-4" />
          {badge && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-flag ring-2 ring-card" />
          )}
        </span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="fixed top-20 flex w-64 flex-col rounded-md border border-border bg-card p-3 shadow-soft h-[calc(100vh-6rem)]">
        {currentUser && (
          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/40">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">@{currentUser.username}</p>
                <p className="text-xs text-muted-foreground">
                  {lvl?.emoji} {lvl?.name}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Karma</span>
                <span className="font-semibold">{currentUser.karma}</span>
              </div>
              <Progress value={prog?.pct ?? 0} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {prog?.span ? `${prog.current}/${prog.span} to next level` : "Max level 🎉"}
              </p>
            </div>
          </div>
        )}

        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {navItem("/feed", "Home Feed", Home)}
          {navItem("/notifications", "Notifications", Bell, HAS_NEW_NOTIFS)}
          {navItem("/profile", "My Profile", UserIcon)}
          {navItem("/leaderboard", "Leaderboard", Trophy)}
        </nav>

        {currentUser && (
          <button
            onClick={() => { logout(); router.navigate({ to: "/" }); }}
            className="mt-2 flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-red-flag/10 hover:text-red-flag"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        )}
      </div>
    </aside>
  );
}

export { CATEGORY_EMOJI };
