import { Link, useRouter } from "@tanstack/react-router";
import { Moon, Sun, LogOut, Home, User as UserIcon, Trophy, Search, Flag, ChevronDown, Lock } from "lucide-react"; // Import Lock icon
import { useVibe } from "@/lib/vibe-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { levelFor } from "@/lib/vibe-store";
import { useState, useCallback } from "react";

export function Navbar({ onSearch, search }: {
  onSearch?: (q: string) => void;
  search?: string;
}) {
  const { currentUser, theme, toggleTheme, logout, users } = useVibe();
  const router = useRouter();
  const lvl = currentUser ? levelFor(currentUser.karma) : null;

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<typeof users>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  const handleUserSearch = useCallback((query: string) => {
    setUserSearchQuery(query);
    if (query.startsWith("@") && query.length > 1) {
      const searchTerm = query.substring(1).toLowerCase();
      const results = users.filter(user => user.username.toLowerCase().startsWith(searchTerm));
      setUserSearchResults(results);
      setIsUserSearchOpen(true);
    } else {
      setIsUserSearchOpen(false);
      setUserSearchResults([]);
    }
  }, [users]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to={currentUser ? "/feed" : "/"} className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand shadow-glow">
            <Flag className="h-5 w-5 text-white" />
          </div>
          <span className="hidden text-xl font-bold tracking-tight sm:inline">
            Flag<span className="text-gradient-brand">it</span>
          </span>
        </Link>

        {currentUser && (
          <Popover open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative mx-auto w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={userSearchQuery}
                  onChange={(e) => {
                    handleUserSearch(e.target.value);
                    if (onSearch && !e.target.value.startsWith("@")) {
                      onSearch(e.target.value);
                    }
                  }}
                  placeholder="Search vibes, #category, or @username..."
                  className="w-full rounded-full border border-border bg-muted/60 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-background"
                />
              </div>
            </PopoverTrigger>
            {isUserSearchOpen && userSearchResults.length > 0 && (
              <PopoverContent className="w-full max-w-md p-0">
                <div className="max-h-60 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <Link
                      key={user.id}
                      to="/profile/$username"
                      params={{ username: user.username }}
                      onClick={() => {
                        setIsUserSearchOpen(false);
                        setUserSearchQuery("");
                      }}
                      className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">@{user.username}</span>
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            )}
          </Popover>
        )}

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 border-2 border-primary/40">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">@{currentUser.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {lvl?.emoji} {lvl?.name} · {currentUser.karma} karma
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.navigate({ to: "/feed" })}>
                  <Home className="mr-2 h-4 w-4" /> Feed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/leaderboard" })}>
                  <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.navigate({ to: "/change-password" })}> {/* Added Change Password */}
                  <Lock className="mr-2 h-4 w-4" /> Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); router.navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted">Log in</Link>
              <Link to="/register" className="rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-95">
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}