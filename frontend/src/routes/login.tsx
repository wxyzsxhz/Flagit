import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useVibe } from "@/lib/vibe-context";
import { Navbar } from "@/components/vibe/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, currentUser } = useVibe();
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  if (currentUser) { router.navigate({ to: "/feed" }); return null; }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(id, password);
    if (!res.ok) return toast.error(res.error ?? "Login failed");
    toast.success("Welcome back! +5 karma for daily login");
    router.navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-glow">
          <Flag className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to check the vibes.</p>

        <form onSubmit={submit} className="mt-8 w-full space-y-4 rounded-md border border-border bg-card p-6 shadow-soft">
          <div className="space-y-1.5">
            <Label>Email or username</Label>
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="midnight@vibe.app" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <p className="text-xs text-muted-foreground">Demo: <code>midnight_owl</code> / <code>password</code></p>
          </div>
          <Button type="submit" className="w-full rounded-full gradient-brand text-white">Log in</Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
