import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type User,
  type Post,
  type Comment,
  type FlagVote,
  type ReactionKey,
  type Category,
  moderate,
} from "./vibe-store";
import { apiGet, apiPost, apiPatch, apiDelete, setAccessToken, refreshSession, ApiError } from "./api";

export type NotificationType = "like_post" | "like_comment" | "reply_comment" | "post_milestone" | "achievement";

export interface Notification {
  id: string;
  type: NotificationType;
  actorId?: string;
  actorName?: string;
  postId?: string;
  commentId?: string;
  message: string;
  meta?: Record<string, unknown>;
  read: boolean;
  createdAt: number;
}

interface VibeContextValue {
  currentUser: User | null;
  users: User[];
  posts: Post[];
  comments: Comment[];
  theme: "light" | "dark";
  loading: boolean;
  toggleTheme: () => void;
  login: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: { username: string; email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userId: string, data: { username?: string; password?: string; avatar?: string }) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  createPost: (data: { title: string; description: string; category: Category; image?: string }) => Promise<{ ok: boolean; error?: string }>;
  deletePost: (postId: string) => Promise<{ ok: boolean; error?: string }>;
  vote: (postId: string, choice: FlagVote) => void;
  addComment: (postId: string, content: string, parentId?: string | null) => Promise<{ ok: boolean; error?: string }>;
  editComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  toggleReaction: (commentId: string, key: ReactionKey) => void;
  reportContent: (kind: "post" | "comment" | "user", id: string, reason: string) => void;
  notifications: Notification[];
  unreadNotifCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const VibeContext = createContext<VibeContextValue | null>(null);

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export function VibeProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Loads (or reloads) the public data every screen needs. `users` is
  // sourced from the top-100-by-karma listing — see backend/README.md's
  // "known limitation" note: there's no unbounded "list every user"
  // endpoint, so username search/leaderboard/sidebars work over that
  // top slice rather than a literal full table scan.
  const loadPublicData = useCallback(async () => {
    const [usersRes, postsRes] = await Promise.all([
      apiGet<{ users: User[] }>("/users?limit=100"),
      apiGet<{ posts: Post[] }>("/posts?limit=50"),
    ]);
    setUsers(usersRes.users);
    setPosts(postsRes.posts);

    const commentLists = await Promise.all(
      postsRes.posts.map((p) => apiGet<{ comments: Comment[] }>(`/posts/${p.id}/comments`))
    );
    setComments(commentLists.flatMap((r) => r.comments));
  }, []);

  useEffect(() => {
    // Theme is pure UI cosmetics, not account data — fine to keep in
    // localStorage directly rather than round-tripping to the API.
    const storedTheme = (localStorage.getItem("vc_theme") as "light" | "dark" | null) || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");

    (async () => {
      try {
        // Restoring the session from the httpOnly refresh cookie is what
        // makes "refresh the page, stay on the current page" work: the
        // route tree renders as usual and, once this resolves, the user
        // is authenticated again without any redirect to /login.
        const restored = await refreshSession();
        if (restored) setCurrentUser(restored.user);
      } finally {
        try {
          await loadPublicData();
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [loadPublicData]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("vc_theme", next);
      return next;
    });
  }, []);

  const register = useCallback(async (data: { username: string; email: string; password: string }) => {
    try {
      const res = await apiPost<{ user: User; accessToken: string }>("/auth/register", data);
      setAccessToken(res.accessToken);
      setCurrentUser(res.user);
      setUsers((prev) => [res.user, ...prev.filter((u) => u.id !== res.user.id)]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Registration failed.") };
    }
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    try {
      const res = await apiPost<{ user: User; accessToken: string }>("/auth/login", { usernameOrEmail, password });
      setAccessToken(res.accessToken);
      setCurrentUser(res.user);
      setUsers((prev) => (prev.some((u) => u.id === res.user.id) ? prev.map((u) => (u.id === res.user.id ? res.user : u)) : [res.user, ...prev]));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Login failed.") };
    }
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget: the UI should feel instant, and even if the
    // network call fails the client-side session is cleared either way.
    apiPost("/auth/logout").catch(() => {});
    setAccessToken(null);
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback(async (userId: string, data: { username?: string; password?: string; avatar?: string }) => {
    try {
      // Password changes go through changePassword() (requires the
      // current password) — this endpoint only ever touches
      // username/avatar, so any `data.password` here is intentionally
      // ignored rather than silently accepted without verification.
      const res = await apiPatch<{ user: User }>("/users/me", {
        username: data.username,
        avatar: data.avatar,
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      setCurrentUser((prev) => (prev && prev.id === userId ? res.user : prev));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Couldn't update profile.") };
    }
  }, []);

  const changePassword = useCallback(async (_userId: string, currentPassword: string, newPassword: string) => {
    try {
      const res = await apiPost<{ user: User; accessToken: string }>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setAccessToken(res.accessToken);
      setCurrentUser(res.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Couldn't change password.") };
    }
  }, []);

  const createPost = useCallback(async (data: { title: string; description: string; category: Category; image?: string }) => {
    if (!currentUser) return { ok: false, error: "Login required." };
    // Fast client-side pre-check for instant feedback; the API re-checks
    // this authoritatively regardless (see moderate() docstring).
    const m1 = moderate(data.title);
    if (!m1.ok) return { ok: false, error: m1.reason };
    const m2 = moderate(data.description);
    if (!m2.ok) return { ok: false, error: m2.reason };

    try {
      const res = await apiPost<{ post: Post }>("/posts", data);
      setPosts((prev) => [res.post, ...prev]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Couldn't post.") };
    }
  }, [currentUser]);

  const deletePost = useCallback(async (postId: string) => {
    try {
      await apiDelete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setComments((prev) => prev.filter((c) => c.postId !== postId));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Couldn't delete post.") };
    }
  }, []);

  const vote = useCallback((postId: string, choice: FlagVote) => {
    if (!currentUser) return;
    // Optimistic update so the flag UI responds instantly...
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const uid = currentUser.id;
      const votes = {
        red: p.votes.red.filter((v) => v !== uid),
        green: p.votes.green.filter((v) => v !== uid),
        black: p.votes.black.filter((v) => v !== uid),
      };
      votes[choice] = [...votes[choice], uid];
      return { ...p, votes };
    }));
    // ...then reconcile with the server's authoritative vote counts
    // (also covers milestone/achievement side effects triggered server-side).
    apiPost<{ post: Post }>(`/posts/${postId}/vote`, { type: choice })
      .then((res) => setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p))))
      .catch(() => loadPublicData().catch(() => {})); // roll back to server truth on failure
  }, [currentUser, loadPublicData]);

  const addComment = useCallback(async (postId: string, content: string, parentId: string | null = null) => {
    if (!currentUser) return { ok: false, error: "Login required." };
    const m = moderate(content);
    if (!m.ok) return { ok: false, error: m.reason };

    try {
      const res = await apiPost<{ comment: Comment }>(`/posts/${postId}/comments`, { content, parentId });
      setComments((prev) => [...prev, res.comment]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Couldn't comment.") };
    }
  }, [currentUser]);

  const editComment = useCallback((id: string, content: string) => {
    const m = moderate(content);
    if (!m.ok) return;
    apiPatch<{ comment: Comment }>(`/comments/${id}`, { content })
      .then((res) => setComments((prev) => prev.map((c) => (c.id === id ? res.comment : c))))
      .catch(() => {});
  }, []);

  const deleteComment = useCallback((id: string) => {
    apiDelete(`/comments/${id}`)
      .then(() => {
        // The API deletes the whole reply thread under `id`; mirror that
        // locally rather than refetching everything.
        setComments((prev) => {
          const toRemove = new Set<string>([id]);
          let changed = true;
          while (changed) {
            changed = false;
            for (const c of prev) {
              if (c.parentId && toRemove.has(c.parentId) && !toRemove.has(c.id)) {
                toRemove.add(c.id); changed = true;
              }
            }
          }
          return prev.filter((c) => !toRemove.has(c.id));
        });
      })
      .catch(() => {});
  }, []);

  const toggleReaction = useCallback((commentId: string, key: ReactionKey) => {
    if (!currentUser) return;
    apiPost<{ comment: Comment }>(`/comments/${commentId}/react`, { reactionKey: key })
      .then((res) => setComments((prev) => prev.map((c) => (c.id === commentId ? res.comment : c))))
      .catch(() => {});
  }, [currentUser]);

  // Only post-reporting is backed by the API today (see backend
  // POST /posts/:id/report). Comment/user reports remain a UI-only stub,
  // same as before this integration.
  const reportContent = useCallback((kind: "post" | "comment" | "user", id: string, reason: string) => {
    if (kind !== "post") return;
    apiPost(`/posts/${id}/report`, { reason }).catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await apiGet<{ notifications: Notification[]; unreadCount: number }>("/notifications");
      setNotifications(res.notifications);
      setUnreadNotifCount(res.unreadCount);
    } catch {
      // notifications are a nice-to-have; a failed fetch shouldn't break the rest of the app
    }
  }, [currentUser]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadNotifCount((c) => Math.max(0, c - 1));
    apiPost(`/notifications/${id}/read`).catch(() => {
      // roll back on failure by refetching from source of truth
      fetchNotifications().catch(() => {});
    });
  }, [fetchNotifications]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifCount(0);
    apiPost("/notifications/read-all").catch(() => {
      fetchNotifications().catch(() => {});
    });
  }, [fetchNotifications]);

  // Load notifications once a session is restored, and clear them on logout.
  useEffect(() => {
    if (currentUser) {
      fetchNotifications().catch(() => {});
    } else {
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [currentUser, fetchNotifications]);


  const value = useMemo<VibeContextValue>(() => ({
    currentUser, users, posts, comments, theme, loading,
    notifications, unreadNotifCount, fetchNotifications, markNotificationRead, markAllNotificationsRead,
    toggleTheme, login, register, logout, updateUser, changePassword,
    createPost, deletePost, vote, addComment, editComment, deleteComment, toggleReaction, reportContent,
  }), [
    currentUser, users, posts, comments, theme, loading,
    notifications, unreadNotifCount, fetchNotifications, markNotificationRead, markAllNotificationsRead,
    toggleTheme, login, register, logout, updateUser, changePassword,
    createPost, deletePost, vote, addComment, editComment, deleteComment, toggleReaction, reportContent,
  ]);

  return <VibeContext.Provider value={value}>{children}</VibeContext.Provider>;
}

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error("useVibe must be used inside VibeProvider");
  return ctx;
}
