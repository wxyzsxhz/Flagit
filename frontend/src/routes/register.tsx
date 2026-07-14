import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useVibe } from "@/lib/vibe-context";
import { Navbar } from "@/components/vibe/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const { register, currentUser } = useVibe();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  if (currentUser) { router.navigate({ to: "/feed" }); return null; }

  const validateForm = () => {
    let isValid = true;
    setUsernameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!username.trim()) {
      setUsernameError("Username is required.");
      isValid = false;
    } else if (!/^[a-z0-9_.]{3,20}$/.test(username.trim().toLowerCase())) {
      setUsernameError("3–20 chars, letters/numbers/._ only.");
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(email.trim().toLowerCase())) {
      setEmailError("Enter a valid email.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirm password is required.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    return isValid;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const res = await register({ username, email, password });
    if (!res.ok) {
      if (res.error?.includes("Username already taken")) {
        setUsernameError(res.error);
      } else if (res.error?.includes("Email already registered")) {
        setEmailError(res.error);
      } else {
        toast.error(res.error ?? "Registration failed");
      }
      return;
    }
    toast.success("Welcome to Flagit!");
    router.navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-glow">
          <Flag className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Join Flagit</h1>
        <p className="mt-1 text-sm text-muted-foreground">Anonymous username. Private email.</p>

        <form onSubmit={submit} className="mt-8 w-full space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="chaotic_neutral" autoFocus />
            {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
            <p className="text-xs text-muted-foreground">3–20 chars · letters, numbers, dots, underscores</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (Gmail or any)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" />
            {confirmPasswordError && <p className="text-xs text-red-500">{confirmPasswordError}</p>}
          </div>
          <Button type="submit" className="w-full rounded-full gradient-brand text-white">Create account</Button>
          <p className="text-center text-sm text-muted-foreground">
            Already vibing? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}