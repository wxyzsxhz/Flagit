import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/edit-profile")({
  component: EditProfilePage,
});

// Placeholder for 12 avatar options
const avatarOptions = [


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

  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=13",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=14",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=15",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=16",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=17",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=18",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=19",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=20",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=21",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=22",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=23",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=24",


];

function EditProfilePage() {
  const { currentUser, updateUser, users, loading } = useVibe();
  const router = useRouter();

  const [username, setUsername] = useState(currentUser?.username || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || avatarOptions[0]);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
  if (loading) return;

  if (!currentUser) {
    router.navigate({ to: "/profile" });
    return;
  }

  setUsername(currentUser.username);
  setSelectedAvatar(currentUser.avatar);
}, [loading, currentUser, router]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (newUsername.trim().toLowerCase() !== currentUser?.username.toLowerCase()) {
      if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase() && u.id !== currentUser?.id)) {
        setUsernameError("Username already taken.");
      } else {
        setUsernameError("");
      }
    } else {
      setUsernameError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (usernameError) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    try {
      const updatedData = {
        username: username.trim(),
        avatar: selectedAvatar,
      };
      
      const res = await updateUser(currentUser.id, updatedData); 
      if (res.ok) {
        toast.success("Profile updated successfully!");
        router.navigate({ to: "/profile" });
      } else {
        toast.error(res.error ?? "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return (
        <PostSkeleton />
    );
  }

  if (!currentUser) {
  return null;
}

  return (
    <AppShell>
      <div className="space-y-6 p-2">

        <Link to="/profile" className="inline-flex items-center mb-2 gap-2 transition-colors text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        <h1 className="text-2xl font-bold">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={currentUser.email} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              required
            />
            {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
          </div>

          {/* Removed New Password input */}

          <div className="space-y-2">
            <Label>Profile Icon</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={selectedAvatar} />
                <AvatarFallback>{username[0]}</AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-12 gap-2">
                {avatarOptions.map((avatarUrl, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`h-10 w-10 rounded-full ${selectedAvatar === avatarUrl ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>{username[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Choose your profile icon.</p>
          </div>

          <Button type="submit" disabled={!!usernameError}>Save Changes</Button>
        </form>
      </div>
    </AppShell>
  );
}