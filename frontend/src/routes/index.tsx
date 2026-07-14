import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useVibe } from "@/lib/vibe-context";
import { Navbar } from "@/components/vibe/Navbar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/vibe-store";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FLAG_CARDS = [
  {
    key: "red",
    label: "Red Flag",
    image: "/images/red.png",
    rotate: "-12deg",
    translateY: "15px",
    translateX: "-130px",
  },
  {
    key: "green",
    label: "Green Flag",
    image: "/images/green.png",
    rotate: "0deg",
    translateY: "0px",
    translateX: "0px",
  },
  {
    key: "black",
    label: "Black Flag",
    image: "/images/black.png",
    rotate: "12deg",
    translateY: "15px",
    translateX: "130px",
  },
];

function Landing() {
  const { currentUser, loading } = useVibe();
  const router = useRouter();
  useEffect(() => {
  if (!loading && currentUser) {
    router.navigate({ to: "/feed" });
  }
}, [loading, currentUser, router]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-4 pb-8 text-center sm:pt-8">
          <h5 className="max-w-2xl text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl">
            A place to call the vibe on{" "}
            <span className="italic text-primary">every</span>  situation.
          </h5>

          <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            Anonymously drop your story. The community decides — green, red, or black flag.
          </p>

          {/* Fanned cards */}
          <div className="relative mx-auto mt-10 h-[190px] w-full max-w-3xl sm:h-[240px]">
            {FLAG_CARDS.map((c, i) => (
              <FanCard key={c.key} card={c} index={i} />
            ))}
          </div>


          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-7 py-3.5 text-sm font-medium text-background transition hover:scale-[1.03]"
            >
              Join verdict
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium text-foreground/70 transition hover:text-foreground"
            >
              Read more
            </Link>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Built for the group chat you never had</h2>
          <p className="mt-3 text-muted-foreground">Everything you need to decide, react, and roast.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: OutlinedFlagRoundedIcon, t: "Three flags only", d: "No stars, no upvotes. Just green, red, or black. Simple verdicts, brutal clarity." },
            { i: GroupsRoundedIcon, t: "Anonymous by default", d: "Post without a face. Your story, not your identity." },
            { i: ForumRoundedIcon, t: "Threaded comments", d: "Reply, react, roast. Seven reactions per comment." },
            { i: BoltRoundedIcon, t: "Karma & levels", d: "Climb from Newbie to Flag Master as the community trusts you." },
            { i: ShieldRoundedIcon, t: "Content moderation", d: "Profanity, PII, and hate filtered before it hits the feed." },
            { i: EmojiEventsRoundedIcon, t: "Leaderboards", d: "See the top vibers of all time. Compete for karma glory." },
          ].map((f) => (
            <div key={f.t} className="group rounded-3xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:shadow-soft">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-foreground text-background">
                <f.i sx={{ fontSize: 22 }} />
              </div>
              <h3 className="text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Any situation, any category</h2>
            <p className="mt-3 text-muted-foreground">Ten categories cover every corner of messy internet life.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {CATEGORIES.map((c) => (
              <div key={c} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">How Flagit works</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: "01", t: "Post your situation", d: "Anonymously drop the story. Add a category, maybe an image." },
            { n: "02", t: "Community votes", d: "Real people call it: green, red, or black flag." },
            { n: "03", t: "Read the takes", d: "Comments, reactions, and the raw verdict. Sleep better tonight." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-7">
              <span className="text-5xl font-semibold tracking-tight text-primary">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight sm:text-5xl">Questions, answered</h2>
        <Accordion type="single" collapsible className="rounded-3xl border border-border bg-card p-2">
          {[
            { q: "Is my identity really hidden?", a: "Posts and comments only show your chosen username — never your real name or email." },
            { q: "What's a Black Flag?", a: "Beyond a red flag. It's for behavior that's dangerous, abusive, or wildly out of line. Use it sparingly." },
            { q: "Can I change my vote?", a: "Yes. One vote per post, but you can switch or remove it anytime." },
            { q: "How is inappropriate content handled?", a: "Every post and comment runs through moderation for profanity, hate speech, harassment, and personal info before publishing." },
            { q: "Is it free?", a: "Free forever. Karma is the only currency." },
          ].map((f, i) => (
            <AccordionItem key={i} value={`i${i}`} className="border-none">
              <AccordionTrigger className="rounded-2xl px-4 hover:bg-muted hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-10 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-10 text-center text-background sm:p-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready to call the vibe?</h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">Thousands of anonymous vibers already spilling and deciding.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90">Create account</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10">Log in</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Flagit · Prototype</p>
      </footer>
    </div>
  );
}

function FanCard({ card, index }: { card: (typeof FLAG_CARDS)[number]; index: number }) {
  return (
    <div className="group absolute left-1/2 top-0 aspect-square h-[150px] w-[100px] sm:h-[240px] sm:w-[190px] overflow-visible"
      style={{
        transform: `translate(calc(-50% + ${card.translateX}), ${card.translateY}) rotate(${card.rotate})`,
        transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: index === 1 ? 3 : 2,
      }}
    >
    <img
      src={card.image}
      alt={card.label}
      className="h-full w-full rounded-md object-cover transition-all duration-500 ease-out
      group-hover:-translate-y-3
      group-hover:scale-[1.03]
      group-hover:drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)]"
      />
    </div>
  );
}
