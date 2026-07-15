import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { AppShell } from "@/components/vibe/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PostSkeleton } from "@/components/vibe/PostSkeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { currentUser, changePassword, loading } = useVibe();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState("");

  useEffect(() => {
    if (!loading && !currentUser) {
      router.navigate({ to: "/login" });
    }
  }, [loading, currentUser, router]);

  const validateForm = () => {
    let isValid = true;
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmNewPasswordError("");

    if (!currentPassword) {
      setCurrentPasswordError("Current password is required.");
      isValid = false;
    }

    if (!newPassword) {
      setNewPasswordError("New password is required.");
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("New password must be at least 6 characters.");
      isValid = false;
    } else if (newPassword === currentPassword) {
      setNewPasswordError("New password cannot be the same as current password.");
      isValid = false;
    }

    if (!confirmNewPassword) {
      setConfirmNewPasswordError("Confirm new password is required.");
      isValid = false;
    } else if (newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError("New passwords do not match.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!validateForm()) {
      return;
    }

    try {
      const res = await changePassword(currentUser.id, currentPassword, newPassword);
      if (res.ok) {
        toast.success("Password changed successfully!");
        router.navigate({ to: "/profile" });
      } else {
        if (res.error?.includes("Incorrect current password")) {
          setCurrentPasswordError(res.error);
        } else {
          toast.error(res.error ?? "Failed to change password. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error("Failed to change password. Please try again.");
    }
  };

  if (loading) {
    return (
        <PostSkeleton />
    );
  }

  if (!currentUser) return null;

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Change Password</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            {currentPasswordError && <p className="text-xs text-red-500">{currentPasswordError}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            {newPasswordError && <p className="text-xs text-red-500">{newPasswordError}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            {confirmNewPasswordError && <p className="text-xs text-red-500">{confirmNewPasswordError}</p>}
          </div>

          <Button type="submit">Change Password</Button>
        </form>
      </div>
    </AppShell>
  );
}