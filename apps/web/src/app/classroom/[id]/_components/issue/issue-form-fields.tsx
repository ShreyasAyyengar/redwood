import type { issueSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { GlobeOff } from "lucide-react";
import type { z } from "zod";
import type { IssueFormBodyApi } from "./issue-form-context";

export function IssueFormFields({ form, existingIssue }: { form: IssueFormBodyApi; existingIssue?: z.infer<typeof issueSchema> }) {
  const autoFillDTEN = () => {
    form.setFieldValue(
      "description",
      "DTEN showing offline (Orbit/Zoom) — Please report whether DTEN was actually offline (unplugged/turned off)."
    );
  };

  return (
    <div className="my-2 flex flex-col gap-5 px-1">
      <Separator className={cn(existingIssue ? existingIssue.issue.urgent && "bg-red-500" : "bg-neutral-500")} />

      <form.AppField name="description">{(field) => <field.DescriptionField existingValue={existingIssue?.issue.description} />}</form.AppField>
      <Button className="w-fit active:scale-95 active:transform" onClick={autoFillDTEN}>
        <GlobeOff className="size-4" />
        DTEN
      </Button>

      <Separator className={cn(existingIssue ? existingIssue.issue.urgent && "bg-red-500" : "bg-neutral-500")} />

      <div className="flex flex-wrap justify-between gap-5">
        <div className="flex flex-col space-y-4">
          <form.AppField name="urgent">{(field) => <field.UrgentField existingValue={existingIssue?.issue.urgent} />}</form.AppField>
          <form.AppField name="supervisorNeeded">
            {(field) => <field.SupervisorNeededField existingValue={existingIssue?.issue.supervisorNeeded} />}
          </form.AppField>
        </div>

        <div className="flex flex-col space-y-4">
          <form.AppField name="cruzfixId">{(field) => <field.CruzfixField existingValue={existingIssue?.issue.cruzfixId} />}</form.AppField>
          <form.AppField name="sodId">{(field) => <field.SodIDField existingValue={existingIssue?.issue.sodId} />}</form.AppField>
        </div>
      </div>

      <Separator className={cn(existingIssue ? existingIssue.issue.urgent && "bg-red-500" : "bg-neutral-500")} />
      {existingIssue && (
        <form.AppField name="resolution">{(field) => <field.ResolutionField existingValue={existingIssue.resolution} />}</form.AppField>
      )}
    </div>
  );
}
