"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { hotlineMediaCodeFields } from "@backend/convex/core/hotline/settings/schemas.ts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { useMutation } from "convex/react";
import { LoaderCircle } from "lucide-react";
import { type SubmitEvent, useState } from "react";

export function MediaCodeDialog({ settings, onClose }: { settings: Doc<"hotlineSettings"> | null; onClose: () => void }) {
  const updateMediaCode = useMutation(api.core.hotline.settings.service.updateHotlineMediaCode);
  const [mediaCode, setMediaCode] = useState(settings?.mediaCode ?? "");
  const [quarterLabel, setQuarterLabel] = useState(settings?.quarterLabel ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const parsed = hotlineMediaCodeFields.safeParse({ mediaCode, quarterLabel });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the media code and quarter.");
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      await updateMediaCode(parsed.data);
      onClose();
    } catch {
      setError("The media code could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="border-zinc-700 bg-zinc-900 sm:max-w-sm" showCloseButton={!isSaving}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{settings ? "Edit media code" : "Set media code"}</DialogTitle>
            <DialogDescription>Update the code when a new quarter begins. Changes are visible to everyone on the hotline.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="hotline-media-code">Media code</Label>
            <Input
              id="hotline-media-code"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={mediaCode}
              onChange={(event) => setMediaCode(event.target.value)}
              disabled={isSaving}
              required
              className="border-zinc-700 bg-zinc-950/50 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotline-media-code-quarter">Quarter</Label>
            <Input
              id="hotline-media-code-quarter"
              value={quarterLabel}
              onChange={(event) => setQuarterLabel(event.target.value)}
              placeholder="e.g. Fall 2026"
              disabled={isSaving}
              required
              className="border-zinc-700 bg-zinc-950/50"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
              {error}
            </p>
          )}

          {settings && (
            <p className="break-words text-xs text-zinc-500">
              Last updated by {settings.updatedBy} on{" "}
              {new Date(settings.updatedAt).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })}.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !mediaCode.trim() || !quarterLabel.trim()}
              className="bg-sky-500 text-sky-950 hover:bg-sky-400"
            >
              {isSaving && <LoaderCircle className="size-4 animate-spin" />}
              {isSaving ? "Saving…" : "Save code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
