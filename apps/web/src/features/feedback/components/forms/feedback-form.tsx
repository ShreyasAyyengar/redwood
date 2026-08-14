"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";
import { z } from "zod";
import { FeedbackAttachmentsField, maxAttachmentBytes } from "./fields/attachments-field";
import { DescriptionField } from "./fields/description-field";

const feedbackFormSchema = z.object({
  description: z.string().min(1, "Description is required."),
});

export type FeedbackFormValues = z.input<typeof feedbackFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    DescriptionField,
  },
  formComponents: {},
});

export default function FeedbackForm({ onSuccess }: { onSuccess?: () => void }) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dropzoneInvalid, setDropzoneInvalid] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const generateUploadUrls = useMutation(api.core.feedback.generateFeedbackAttachmentUploadUrls);
  const sendFeedback = useAction(api.core.feedback.sendFeedback);

  const attachmentBytes = attachments.reduce((total, attachment) => total + attachment.size, 0);
  const attachmentsInvalid = dropzoneInvalid || attachmentBytes > maxAttachmentBytes;

  const form = useAppForm({
    defaultValues: {
      description: "",
    } as FeedbackFormValues,
    validators: {
      onChange: feedbackFormSchema,
      onMount: feedbackFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const uploadUrls = await generateUploadUrls({ uploadCount: attachments.length });
        const uploadedAttachments = await Promise.all(
          attachments.map(async (attachment, index) => {
            const uploadUrl = uploadUrls[index];
            if (!uploadUrl) throw new Error("Unable to prepare feedback attachment upload.");
            const response = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": attachment.type || "application/octet-stream" },
              body: attachment,
            });
            if (!response.ok) throw new Error(`Unable to upload ${attachment.name}.`);
            const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
            return { storageId, filename: attachment.name };
          })
        );
        await sendFeedback({ description: value.description, attachments: uploadedAttachments });
        onSuccess?.();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to send feedback.");
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">Feedback</DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="flex flex-col px-1">
          <form.AppField name="description">{(field) => <field.DescriptionField />}</form.AppField>

          <div className="my-2">
            <FeedbackAttachmentsField attachments={attachments} onAttachmentsChange={setAttachments} onInvalidChange={setDropzoneInvalid} />
          </div>

          {submitError && <p className="font-medium text-[0.8rem] text-destructive">{submitError}</p>}
        </div>
      </ScrollArea>

      <DialogFooter className="my-3">
        <div className="flex w-full justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                className={cn(
                  canSubmit ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50" : "cursor-not-allowed hover:bg-accent",
                  isSubmitting ? "cursor-wait" : "cursor-default"
                )}
                onClick={form.handleSubmit}
                disabled={!canSubmit || isSubmitting || attachmentsInvalid}
              >
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </DialogFooter>
    </>
  );
}
import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
