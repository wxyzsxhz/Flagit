import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Category } from "@/lib/vibe-store";
import { useVibe } from "@/lib/vibe-context";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

export function CreatePostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { createPost } = useVibe();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Relationship");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("Relationship");
    setImageFile(null);
    setImagePreview(undefined);
  };

  const submit = async () => {
    if (title.trim().length < 5) {
      return toast.error("Title needs at least 5 characters.");
    }

    if (description.trim().length < 10) {
      return toast.error("Description needs at least 10 characters.");
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await createPost(formData);

    if (!res.ok) {
      return toast.error(res.error ?? "Couldn't post.");
    }

    toast.success("Posted! Let the internet decide the vibe.");

    reset();
    onOpenChange(false);
  };


  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 3_000_000) {
      return toast.error("Image too large (max 3MB).");
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share the situation</DialogTitle>
          <DialogDescription>Anonymous. Honest. The community will call the vibe.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My boss texts me on weekends…" maxLength={140} />
            <p className="text-right text-[10px] text-muted-foreground">{title.length}/140</p>
          </div>
          <div className="space-y-1">
            <Label>What happened?</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Give us the story. Be specific." rows={5} maxLength={2000} />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Image (optional)</Label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={imagePreview}
                  alt=""
                  className="max-h-48 w-full object-cover"
                />

                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(undefined);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 py-6 text-sm text-muted-foreground hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                Add an image

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="rounded-full gradient-brand text-white">Post the vibe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
