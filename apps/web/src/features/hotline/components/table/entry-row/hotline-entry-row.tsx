"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { Check, Hash, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import {
  getHotlineFormValues,
  hotlineFormSchema,
  MEDIA_CODE_CATEGORY_LABEL,
  MEDIA_CODE_PRESET,
  serializeHotlineFormValues,
} from "../../../model/hotline-form.ts";
import { HOTLINE_COLUMN_WIDTHS } from "../../../model/hotline-table-layout.ts";
import { CalleeControl } from "./callee-control.tsx";
import { CategoryControl } from "./category-control.tsx";
import { EntryTextareaCell } from "./entry-textarea-cell.tsx";
import { InlineDateField } from "./inline-date-field.tsx";
import { InlineField } from "./inline-field.tsx";
import { InlineLocationField } from "./inline-location-field.tsx";
import { InlineToggle } from "./inline-toggle.tsx";

type HotlineEntryRowProps = {
  categories: Doc<"hotlineCategories">[];
  categoryColumnWidth: number;
  classrooms: Doc<"classrooms">[];
  currentUserEmail: string;
  existingEntry?: Doc<"hotline">;
  isAdmin: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  users: Array<{ email: string }>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function HotlineEntryRow({
  categories,
  categoryColumnWidth,
  classrooms,
  currentUserEmail,
  existingEntry,
  isAdmin,
  onCancel,
  onSuccess,
  users,
}: HotlineEntryRowProps) {
  const createEntry = useMutation(api.core.hotline.service.createHotlineEntry);
  const updateEntry = useMutation(api.core.hotline.service.updateHotlineEntry);
  const [submitError, setSubmitError] = useState<string>();
  const mediaCodeCategory = categories.find(
    (category) => category.label.trim().localeCompare(MEDIA_CODE_CATEGORY_LABEL, undefined, { sensitivity: "accent" }) === 0
  );
  const form = useForm({
    defaultValues: getHotlineFormValues(existingEntry, classrooms, currentUserEmail),
    validators: {
      onChange: hotlineFormSchema,
      onMount: hotlineFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(undefined);
      try {
        const serialized = serializeHotlineFormValues(value, classrooms);
        if (existingEntry) await updateEntry({ _id: existingEntry._id, ...serialized });
        else await createEntry(serialized);
        onSuccess();
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
  });

  const applyMediaCodeTemplate = () => {
    if (!mediaCodeCategory) return;
    form.setFieldValue("callerIssueDescription", MEDIA_CODE_PRESET.callerIssueDescription);
    form.setFieldValue("calleeResolution", MEDIA_CODE_PRESET.calleeResolution);
    form.setFieldValue("hotlineCategory", mediaCodeCategory._id);
    form.setFieldValue("serviceLocation", MEDIA_CODE_PRESET.serviceLocation);
    form.setFieldValue("department", MEDIA_CODE_PRESET.department);
  };

  return (
    <div className="relative z-10 w-full border-sky-500/40 border-b bg-sky-500/[0.045] shadow-[inset_3px_0_0_rgb(56_189_248)]">
      <div className="flex h-9 items-center gap-2 border-zinc-800/70 border-b px-3">
        <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.14em]">Quick fill</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-zinc-700 bg-zinc-900 px-2.5 text-xs"
          disabled={!mediaCodeCategory}
          onClick={applyMediaCodeTemplate}
          title={mediaCodeCategory ? "Apply the Media Code template" : `Create the “${MEDIA_CODE_CATEGORY_LABEL}” category first`}
        >
          <Hash className="size-3.5" />
          Media Code
        </Button>
      </div>

      <form
        className="flex min-h-36 items-stretch"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="dateOfCall">
          {(dateField) => (
            <InlineField width={HOTLINE_COLUMN_WIDTHS.call}>
              <InlineDateField value={dateField.state.value} onBlur={dateField.handleBlur} onChange={dateField.handleChange} />
              <form.Field name="takenBy">
                {(calleeField) => (
                  <CalleeControl
                    invalid={calleeField.state.meta.isTouched && !calleeField.state.meta.isValid}
                    isAdmin={isAdmin}
                    onChange={calleeField.handleChange}
                    users={users}
                    value={calleeField.state.value}
                  />
                )}
              </form.Field>
            </InlineField>
          )}
        </form.Field>

        <form.Field name="callerLocation">
          {(field) => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <InlineField width={HOTLINE_COLUMN_WIDTHS.location} invalid={invalid} errors={field.state.meta.errors}>
                <InlineLocationField
                  classrooms={classrooms}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  invalid={invalid}
                />
              </InlineField>
            );
          }}
        </form.Field>

        <form.Field name="callerIdentifier">
          {(field) => (
            <EntryTextareaCell
              label="Caller ID"
              placeholder="Caller ID"
              width={HOTLINE_COLUMN_WIDTHS.identifier}
              value={field.state.value}
              invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="callerIssueDescription">
          {(field) => (
            <EntryTextareaCell
              flexible
              label="Caller issue"
              placeholder="Describe the caller's issue"
              width={HOTLINE_COLUMN_WIDTHS.issue}
              value={field.state.value}
              invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="calleeResolution">
          {(field) => (
            <EntryTextareaCell
              flexible
              label="Resolution"
              placeholder="Describe the resolution"
              width={HOTLINE_COLUMN_WIDTHS.resolution}
              value={field.state.value}
              invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              errors={field.state.meta.errors}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="hotlineCategory">
          {(field) => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <InlineField width={categoryColumnWidth} invalid={invalid} errors={field.state.meta.errors}>
                <CategoryControl categories={categories} invalid={invalid} onChange={field.handleChange} value={field.state.value} />
              </InlineField>
            );
          }}
        </form.Field>

        <form.Field name="serviceLocation">
          {(field) => (
            <InlineField width={HOTLINE_COLUMN_WIDTHS.serviceLocation}>
              <InlineToggle
                value={field.state.value}
                onChange={(value) => field.handleChange(value as "ON-SITE" | "PHONE")}
                options={[
                  { label: "On-site", value: "ON-SITE" },
                  { label: "Phone", value: "PHONE" },
                ]}
              />
            </InlineField>
          )}
        </form.Field>

        <form.Field name="department">
          {(field) => (
            <InlineField width={HOTLINE_COLUMN_WIDTHS.department}>
              <InlineToggle
                value={field.state.value}
                onChange={(value) => field.handleChange(value as "INSTRUCTION" | "EVENTS")}
                options={[
                  { label: "Instruction", value: "INSTRUCTION" },
                  { label: "Events", value: "EVENTS" },
                ]}
              />
            </InlineField>
          )}
        </form.Field>

        <InlineField width={HOTLINE_COLUMN_WIDTHS.actions} className="flex-row items-center justify-start gap-1 border-r-0 px-1">
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                size="icon-sm"
                disabled={!canSubmit || isSubmitting}
                className="bg-sky-500 text-sky-950 hover:bg-sky-400 disabled:bg-neutral-500"
                aria-label={existingEntry ? "Save hotline entry changes" : "Save new hotline entry"}
                title={existingEntry ? "Save changes" : "Save new entry"}
              >
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              </Button>
            )}
          </form.Subscribe>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="bg-red-700/30"
            onClick={onCancel}
            aria-label={existingEntry ? "Cancel editing hotline entry" : "Cancel new hotline entry"}
            title="Cancel"
          >
            <X className="size-4" />
          </Button>
        </InlineField>
      </form>

      {submitError && <p className="border-sky-500/20 border-t bg-red-500/10 px-3 py-1.5 text-red-300 text-xs">{submitError}</p>}
    </div>
  );
}
