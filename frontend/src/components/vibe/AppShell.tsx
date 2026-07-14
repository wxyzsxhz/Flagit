import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import type { Category } from "@/lib/vibe-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  onSearch?: (q: string) => void;
  search?: string;
  activeCategory?: Category | "all";
  onCategory?: (c: Category | "all") => void;
  showRightSidebar?: boolean;
}

export function AppShell({
  children,
  onSearch,
  search,
  activeCategory,
  onCategory,
  showRightSidebar = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <Navbar onSearch={onSearch} search={search} />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 pb-24 lg:pb-6">
        <LeftSidebar />

        <main className={cn("min-w-0 space-y-4", showRightSidebar ? "flex-1 max-w-2xl" : "flex-1")}>
          <div className={cn(showRightSidebar ? "" : "mx-auto max-w-2xl")}>{children}</div>
        </main>

        {showRightSidebar && (
          <RightSidebar activeCategory={activeCategory} onCategory={onCategory} />
        )}
      </div>

      <MobileBottomNav hasNewNotifs />
    </div>
  );
}
