// Shared types + pure helpers for the Flag Nation frontend.
//
// This file used to also hold an in-browser localStorage "database"
// (demo users/posts/comments, seedIfNeeded, and a `store` object) that
// stood in for a real backend. That's now provided by the API instead
// (see `./api.ts` and `./vibe-context.tsx`), so this file keeps only
// what every other component actually imports: the shared types, the
// category/reaction constants, and the pure display helpers
// (levelFor, karmaProgress, totalVotes, commentCount) that don't touch
// storage at all.

export type Category =
  | "Relationship"
  | "Work"
  | "School"
  | "Family"
  | "Friends"
  | "Lifestyle"
  | "Finance"
  | "Social Media"
  | "Gaming"
  | "Others";

export const CATEGORIES: Category[] = [
  "Relationship",
  "Work",
  "School",
  "Family",
  "Friends",
  "Lifestyle",
  "Finance",
  "Social Media",
  "Gaming",
  "Others",
];

export type FlagVote = "red" | "green" | "black";
export const REACTIONS = [
  { key: "funny", emoji: "😂", label: "Funny" },
  { key: "shocking", emoji: "😮", label: "Shocking" },
  { key: "sad", emoji: "😭", label: "Sad" },
  { key: "crazy", emoji: "💀", label: "Crazy" },
  { key: "confusing", emoji: "🤔", label: "Confusing" },
  { key: "agree", emoji: "❤️", label: "Agree" },
  { key: "wild", emoji: "🔥", label: "Wild" },
] as const;
export type ReactionKey = (typeof REACTIONS)[number]["key"];

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string; // never populated by the API; kept for type compat
  avatar: string;
  karma: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: number;
  editedAt?: number;
  reactions: Record<ReactionKey, string[]>; // userId list per reaction
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  image?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number;
  votes: { red: string[]; green: string[]; black: string[] };
}

export function emptyReactions(): Record<ReactionKey, string[]> {
  return {
    funny: [], shocking: [], sad: [], crazy: [], confusing: [], agree: [], wild: [],
  };
}

const AVATARS = [
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=1",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=2",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=3",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=4",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=5",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=6",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=7",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=8",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=9",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=10",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=11",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=12",
];

export function randomAvatar(seed?: string) {
  if (seed) return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

// Client-side pre-check only, for instant form feedback. The API
// (src/services/moderation.service.js on the backend) re-checks all of
// this authoritatively and is what actually decides whether content is
// accepted — this copy existing client-side just avoids a round trip for
// the common case.
const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "faggot", "nigger", "retard"];
export function moderate(text: string): { ok: boolean; reason?: string; cleaned: string } {
  const lower = text.toLowerCase();
  for (const w of BAD_WORDS) {
    if (lower.includes(w)) return { ok: false, reason: `Contains disallowed language ("${w}").`, cleaned: text };
  }
  if (/@\s*[a-z0-9_.]{1,32}/i.test(text)) {
    return { ok: false, reason: "Mentioning other users (@username) isn't allowed.", cleaned: text };
  }
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) return { ok: false, reason: "Please remove email addresses.", cleaned: text };
  if (/(\+?\d[\d\s\-().]{7,})/.test(text)) return { ok: false, reason: "Please remove phone numbers.", cleaned: text };
  return { ok: true, cleaned: text };
}

export function levelFor(karma: number) {
  if (karma >= 1500) return { name: "Flag Master", emoji: "👑", min: 1500, next: null };
  if (karma >= 500) return { name: "Flag Expert", emoji: "🔥", min: 500, next: 1500 };
  if (karma >= 100) return { name: "Observer", emoji: "⭐", min: 100, next: 500 };
  return { name: "Newbie", emoji: "🌱", min: 0, next: 100 };
}

export function karmaProgress(karma: number) {
  const lvl = levelFor(karma);
  if (!lvl.next) return { pct: 100, current: karma - lvl.min, span: 0 };
  const span = lvl.next - lvl.min;
  const current = karma - lvl.min;
  return { pct: Math.min(100, Math.round((current / span) * 100)), current, span };
}

export function totalVotes(p: Post) {
  return p.votes.red.length + p.votes.green.length + p.votes.black.length;
}

export function commentCount(postId: string, comments: Comment[]) {
  return comments.filter((c) => c.postId === postId).length;
}
