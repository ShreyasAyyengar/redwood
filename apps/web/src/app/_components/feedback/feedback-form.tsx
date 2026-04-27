"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";
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

  const sendFeedback = useMutation(
    webClientORPC.feedback.sendFeedback.mutationOptions({
      onSuccess: () => {
        setSubmitError(null);
        onSuccess?.();
      },
      onError: (error) => {
        setSubmitError(error.message);
      },
    })
  );

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
      await sendFeedback.mutateAsync({
        description: value.description,
        attachments,
      });
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
                  isSubmitting || sendFeedback.isPending ? "cursor-wait" : "cursor-default"
                )}
                onClick={form.handleSubmit}
                disabled={!canSubmit || isSubmitting || sendFeedback.isPending || attachmentsInvalid}
              >
                {isSubmitting || sendFeedback.isPending ? "Sending..." : "Send Feedback"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </DialogFooter>
    </>
  );
}
