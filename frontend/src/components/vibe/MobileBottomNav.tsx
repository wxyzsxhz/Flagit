import { Link, useRouter } from "@tanstack/react-router";
import { Home, Trophy, Bell, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/feed", label: "Home", Icon: Home },
  { to: "/leaderboard", label: "Leaderboard", Icon: Trophy },
  { to: "/notifications", label: "Alerts", Icon: Bell },
  { to: "/profile", label: "Profile", Icon: UserIcon },
] as const;

export function MobileBottomNav({ hasNewNotifs = false }: { hasNewNotifs?: boolean }) {
  const router = useRouter();
  const path = router.state.location.pathname;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ to, label, Icon }) => {
          const active = path === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {to === "/notifications" && hasNewNotifs && (
                  <span className="absolute top-1.5 right-1/2 -mr-3 h-2 w-2 rounded-full bg-red-flag" />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
