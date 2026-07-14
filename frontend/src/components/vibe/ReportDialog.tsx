import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const REPORT_REASONS = [
  "Spam",
  "Hate speech",
  "Harassment",
  "Nudity or sexual content",
  "Violence",
  "Misinformation",
  "Other",
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: (reason: string) => void;
  type: "post" | "comment";
}

export function ReportDialog({ open, onOpenChange, onReport, type }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReport = () => {
    if (selectedReason) {
      setShowConfirmation(true);
    } else {
      toast.error("Please select a reason to report.");
    }
  };

  const confirmReport = () => {
    if (selectedReason) {
      onReport(selectedReason);
      toast.success("Report successful!");
      setSelectedReason(null);
      setShowConfirmation(false);
      onOpenChange(false);
    }
  };

  const cancelReport = () => {
    setSelectedReason(null);
    setShowConfirmation(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{showConfirmation ? "Confirm Report" : `Report this ${type}`}</AlertDialogTitle>
          <AlertDialogDescription>
            {showConfirmation
              ? `Are you sure you want to report this ${type} for "${selectedReason}"?`
              : `Please select a reason for reporting this ${type}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!showConfirmation && (
          <RadioGroup onValueChange={setSelectedReason} value={selectedReason || ""} className="grid gap-2">
            {REPORT_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={`reason-${reason}`} />
                <Label htmlFor={`reason-${reason}`}>{reason}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelReport}>Cancel</AlertDialogCancel>
          {showConfirmation ? (
            <AlertDialogAction onClick={confirmReport}>Confirm</AlertDialogAction>
          ) : (
            <Button onClick={handleReport} disabled={!selectedReason}>Report</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}